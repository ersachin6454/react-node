import React, { useState, useEffect } from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import '../styles/Home.css';

function Home() {
  const [latestProducts, setLatestProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatestProducts = async () => {
      try {
        const response = await fetch(`/api/products?t=${Date.now()}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const products = await response.json();
        // Get the first 2 products (latest ones)
        const latestTwo = products.slice(0, 3);
        setLatestProducts(latestTwo);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching latest products:', error);
        setLoading(false);
      }
    };

    fetchLatestProducts();
  }, []);

  const slides = [
    {
      id: 1,
      title: "Welcome to Our App",
      description: "Discover amazing features and functionality",
      image: "https://images.unsplash.com/photo-1551650975-87deedd944c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      buttonText: "Get Started"
    },
    {
      id: 2,
      title: "Modern Design",
      description: "Beautiful and responsive user interface",
      image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      buttonText: "Learn More"
    },
    {
      id: 3,
      title: "Powerful Features",
      description: "Everything you need in one place",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      buttonText: "Explore"
    },
    {
      id: 4,
      title: "Mobile First",
      description: "Optimized for all devices and screen sizes",
      image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      buttonText: "Discover"
    },
    {
      id: 5,
      title: "Fast Performance",
      description: "Lightning-fast loading and smooth interactions",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      buttonText: "Experience"
    }
  ];

  const settings = {
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 2000,
    pauseOnHover: true,
    fade: false,
    swipe: true,
    touchMove: true,
    swipeToSlide: true,
    arrows: true,
    prevArrow: <CustomPrevArrow />,
    nextArrow: <CustomNextArrow />,
    customPaging: (i) => <CustomDot />,
    responsive: [
      {
        breakpoint: 768,
        settings: {
          arrows: false,
          dots: true,
          swipe: true,
          touchMove: true
        }
      }
    ]
  };

  return (
    <div className="home-container">
      <Slider {...settings}>
        {slides.map((slide) => (
          <div key={slide.id} className="slide">
            <div 
              className="slide-background"
              style={{ backgroundImage: `url(${slide.image})` }}
            >
              {/* <div className="slide-content">
                <h1 className="slide-title">{slide.title}</h1>
                <p className="slide-description">{slide.description}</p>
                <button className="slide-button">{slide.buttonText}</button>
              </div> */}
            </div>
          </div>
        ))}
      </Slider>
      <div className="latest-products-section">
        <div className="container">
          <h2 className="section-title">Latest Products</h2>
          {loading ? (
            <div className="loading">Loading latest products...</div>
          ) : (
            <div className="latest-products-grid">
              {latestProducts.map((product) => (
                <div key={product.id} className="product-card">
                  <div className="product-image">
                    <img 
                      src={product.images && product.images.length > 0 ? product.images[0] : 'https://via.placeholder.com/300x250?text=No+Image'} 
                      alt={product.name}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/300x250?text=Image+Not+Found';
                      }}
                    />
                  </div>
                  <div className="product-info">
                    <h3 className="product-name">{product.name}</h3>
                    <p className="product-description">{product.description}</p>
                    <div className="product-price">
                      <span className="current-price">${product.sell_price}</span>
                      {product.price && product.price > product.sell_price && (
                        <span className="original-price">${product.price}</span>
                      )}
                    </div>
                    <div className="product-quantity">
                      Stock: {product.quantity} available
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Custom Arrow Components
const CustomPrevArrow = ({ onClick }) => (
  <button className="slick-arrow slick-prev" onClick={onClick}>
    &#8249;
  </button>
);

const CustomNextArrow = ({ onClick }) => (
  <button className="slick-arrow slick-next" onClick={onClick}>
    &#8250;
  </button>
);

// Custom Dot Component
const CustomDot = () => (
  <button className="slick-dot-custom">
    <span></span>
  </button>
);

export default Home;
