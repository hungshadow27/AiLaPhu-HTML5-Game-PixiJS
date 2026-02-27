import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: 'AIzaSyBNuHgaks4T_jKpOhPZSMkMfd0FjKGIorM',
    authDomain: 'ai-la-phu-questions.firebaseapp.com',
    projectId: 'ai-la-phu-questions',
    storageBucket: 'ai-la-phu-questions.firebasestorage.app',
    messagingSenderId: '26849383940',
    appId: '1:26849383940:web:79b266b5403ee52fd54751',
    measurementId: 'G-3W7HZDERHG',
};

const app = initializeApp(firebaseConfig);

// Force HTTP long-polling instead of WebSocket to avoid dev network issues
export const db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
});
