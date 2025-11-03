export interface Bowler {
  id: string; // Firestore document IDs are strings
  name: string;
  email: string;
  phone: string;
  optedIn: boolean;
}