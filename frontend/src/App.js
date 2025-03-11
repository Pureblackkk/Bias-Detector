import logo from './logo.svg';
import './App.css';
import { nanoid } from 'nanoid';
import Dashboard from './dashboard/Dashboard';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Set local storage when loading the app
(() => {
  const uid = localStorage.getItem('user_id');
  if (!uid) {
    const generated_uid = nanoid();
    localStorage.setItem('user_id', generated_uid);
  }
})();

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/:dataset/:label" element={<Dashboard />} />
        <Route path="*" element={<Navigate replace to="/urbancars/urban" />} />
      </Routes>
    </Router>
  );
}

export default App;
