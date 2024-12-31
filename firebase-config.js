const firebaseConfig = {
  apiKey: "AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  authDomain: "quiz-nl.firebaseapp.com",
  databaseURL: "https://quiz-nl-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "quiz-nl",
  storageBucket: "quiz-nl.appspot.com",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
