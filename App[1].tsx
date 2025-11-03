import React, { useState, useEffect } from 'react';
import { Bowler } from './types';
import BowlerForm from './components/BowlerForm';
import AdminPanel from './components/AdminPanel';
import AdminLogin from './components/AdminLogin';
import Header from './components/Header';
import { bowlersCollection } from './firebase'; // Import the collection reference

const App: React.FC = () => {
  const [bowlers, setBowlers] = useState<Bowler[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('isAdminAuthenticated') === 'true';
  });

  const [route, setRoute] = useState(window.location.hash);

  // Effect to fetch and listen for real-time updates from Firestore
  useEffect(() => {
    setLoading(true);
    // onSnapshot returns an unsubscribe function that we call on cleanup
    const unsubscribe = bowlersCollection.onSnapshot(
      snapshot => {
        const bowlersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Bowler[];
        setBowlers(bowlersData);
        setLoading(false);
      },
      error => {
        console.error("Error fetching bowlers from Firestore: ", error);
        alert("Could not connect to the database. Please check your Firebase configuration and internet connection.");
        setLoading(false);
      }
    );

    // Cleanup subscription on component unmount
    return () => unsubscribe();
  }, []);

  // Effect to handle routing based on URL hash changes
  useEffect(() => {
    const handleHashChange = () => {
      setRoute(window.location.hash);
    };
    
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);
  
  const addBowler = async (bowler: Omit<Bowler, 'id'>): Promise<boolean> => {
    const normalizePhone = (p: string) => p.replace(/\D/g, '');
    const newPhoneNormalized = normalizePhone(bowler.phone);

    // Check for duplicates based on the current local state, which is kept
    // in sync with Firestore in real-time.
    if (bowlers.some(b => 
        b.email.toLowerCase() === bowler.email.toLowerCase() || 
        normalizePhone(b.phone) === newPhoneNormalized
    )) {
        console.warn('Duplicate entry detected. Not adding bowler.');
        return false; // Indicate failure (duplicate)
    }

    try {
      await bowlersCollection.add({
        ...bowler,
        email: bowler.email.toLowerCase(), // Store email in lowercase for consistency
        createdAt: new Date() // Good practice to add a timestamp
      });
      return true;
    } catch (error) {
      console.error("Error adding bowler: ", error);
      return false;
    }
  };

  const deleteBowler = async (id: string) => {
    if (window.confirm(`Are you sure you want to delete this entry?`)) {
      try {
        await bowlersCollection.doc(id).delete();
      } catch (error) {
        console.error("Error deleting bowler: ", error);
        alert('Failed to delete entry. Please try again.');
      }
    }
  };

  const clearBowlers = async () => {
    if (window.confirm('Are you sure you want to delete all entries? This action cannot be undone.')) {
        // For large collections, this should be done in a backend function.
        // For a small contest of ~100 people, batch delete on the client is fine.
        const batch = bowlersCollection.firestore.batch();
        bowlers.forEach(bowler => {
          batch.delete(bowlersCollection.doc(bowler.id));
        });
        try {
          await batch.commit();
        } catch (error) {
          console.error("Error clearing bowlers: ", error);
          alert('Failed to clear all entries. Please try again.');
        }
    }
  };

  const handleLoginSuccess = () => {
    sessionStorage.setItem('isAdminAuthenticated', 'true');
    setIsAuthenticated(true);
    window.location.hash = '#/admin';
  };

  let content;
  if (route.startsWith('#/admin')) {
    if (isAuthenticated) {
      content = <AdminPanel bowlers={bowlers} onClearBowlers={clearBowlers} onDeleteBowler={deleteBowler} loading={loading} />;
    } else {
      content = <AdminLogin onLoginSuccess={handleLoginSuccess} />;
    }
  } else {
    content = <BowlerForm onAddBowler={addBowler} />;
  }

  return (
    <div className="min-h-screen bg-bowling-alley-dark text-bowling-pin-white">
      <Header isAuthenticated={isAuthenticated} />
      <main className="container mx-auto p-4 md:p-8">
        {content}
      </main>
    </div>
  );
};

export default App;