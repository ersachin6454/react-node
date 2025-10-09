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
        console.log('Fetching latest products...');
        const response = await fetch(`/api/products?t=${Date.now()}`);
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const products = await response.json();
        console.log('Products received:', products);
        console.log('Number of products:', products.length);
        
        // Get the first 2 products (latest ones)
        const latestTwo = products.slice(0, 2);
        console.log('Latest 2 products:', latestTwo);
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
    autoplaySpeed: 3000,
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
      
      {/* Latest Products Section */}
      <div className="latest-products-section" style={{
        backgroundColor: 'red', 
        minHeight: '200px',
        position: 'relative',
        zIndex: 10000,
        border: '5px solid orange'
      }}>
        <div className="container" style={{backgroundColor: 'purple', padding: '20px'}}>
          <h2 className="section-title" style={{color: 'white', fontSize: '30px'}}>Latest Products</h2>
          <div style={{backgroundColor: 'yellow', padding: '20px', margin: '10px'}}>
            <h3>DEBUG INFO:</h3>
            <p>Loading: {loading.toString()}</p>
            <p>Products count: {latestProducts.length}</p>
            <p>Products: {JSON.stringify(latestProducts, null, 2)}</p>
          </div>
          
          {loading ? (
            <div className="loading">Loading latest products...</div>
          ) : latestProducts.length === 0 ? (
            <div className="loading">No products available</div>
          ) : (
            <div className="latest-products-grid" style={{backgroundColor: 'lightgreen', padding: '20px', minHeight: '400px'}}>
              {/* HARDCODED TEST PRODUCT */}
              <div style={{
                backgroundColor: 'lime',
                border: '5px solid black',
                padding: '20px',
                margin: '10px',
                fontSize: '20px',
                fontWeight: 'bold'
              }}>
                <h3>HARDCODED TEST PRODUCT</h3>
                <p>This should be visible!</p>
              </div>
              
              {console.log('Rendering products:', latestProducts)}
              {latestProducts.map((product) => {
                console.log('Product data:', product);
                console.log('Product images:', product.images, typeof product.images);
                return (
                <div key={product.id} className="product-card" style={{
                  border: '3px solid red', 
                  margin: '10px', 
                  backgroundColor: 'white',
                  minHeight: '300px',
                  zIndex: 9999,
                  position: 'relative'
                }}>
                  <div className="product-image">
                    {(() => {
                      let imageUrl = 'https://via.placeholder.com/300x200?text=No+Image';
                      
                      if (product.images) {
                        try {
                          // If images is a string, parse it
                          const images = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
                          if (Array.isArray(images) && images.length > 0) {
                            imageUrl = images[0];
                          }
                        } catch (error) {
                          console.log('Error parsing images for product:', product.id, error);
                        }
                      }
                      
                      return (
                        <img 
                          src={imageUrl} 
                          alt={product.name}
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                          }}
                        />
                      );
                    })()}
                  </div>
                  <div className="product-info" style={{padding: '20px', backgroundColor: 'yellow'}}>
                    <h3 className="product-name" style={{color: 'black', fontSize: '20px', fontWeight: 'bold'}}>{product.name}</h3>
                    <p className="product-description" style={{color: 'black'}}>{product.description}</p>
                    <div className="product-price" style={{color: 'red', fontSize: '18px', fontWeight: 'bold'}}>
                      <span className="current-price">${product.sell_price}</span>
                      {product.price !== product.sell_price && (
                        <span className="original-price">${product.price}</span>
                      )}
                    </div>
                    <div className="product-quantity" style={{color: 'blue', fontSize: '16px'}}>
                      Stock: {product.quantity}
                    </div>
                    <div style={{color: 'purple', fontSize: '14px', marginTop: '10px'}}>
                      DEBUG: Product ID {product.id}
                    </div>
                  </div>
                </div>
                );
              })}
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
