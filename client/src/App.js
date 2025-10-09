import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Register from './pages/Register';
import Products from './pages/Products';
import Cart from './pages/Cart';
import Wishlist from './pages/Wishlist';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import NavigationBar from './components/NavigationBar';
import Home from './components/Home';
import Footer from './components/Footer';
import { AuthProvider } from './contexts/AuthContext';
import './styles/App.css';

// Uncomment this line when you add your logo to src/assets/
// import logo from './assets/logo.png';



function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <NavigationBar />
          <main className="main-content">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/wishlist" element={<Wishlist />} />
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
