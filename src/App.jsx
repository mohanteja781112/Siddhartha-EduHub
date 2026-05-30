import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';

function App() {
  return (
    <div className="min-h-screen bg-white font-sans selection:bg-edu-blue selection:text-white">
      <Navbar />
      <main>
        <Hero />
      </main>
    </div>
  );
}

export default App;
