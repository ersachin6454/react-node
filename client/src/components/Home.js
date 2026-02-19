import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import '../styles/Home.css';

function Home() {
  const navigate = useNavigate();
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
        // Filter only active products and get the first 3 products (latest ones)
        // Handle case where is_active might not exist yet (backward compatibility)
        const activeProducts = products.filter(p => p.is_active === undefined || p.is_active !== false);
        const latestThree = activeProducts.slice(0, 3);
        setLatestProducts(latestThree);
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
      image: "/assets/image/home/banner1.jpg"
    },
    {
      id: 2,
      image: "/assets/image/home/baner2.jpg"
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
            <div className="slide-background">
              <img
                src={slide.image}
                alt={`Banner ${slide.id}`}
                onError={(e) => {
                  console.error('Failed to load image:', slide.image);
                  e.target.style.display = 'none';
                }}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center'
                }}
              />
            </div>
          </div>
        ))}
      </Slider>
      <div className="latest-products-section">
        <div className="container">
          {loading ? (
            <div className="loading">Loading latest products...</div>
          ) : (
            <div className="latest-products-grid">
              {latestProducts.map((product) => (
                <div
                  key={product.id}
                  className="product-card"
                  onClick={() => navigate(`/product/${product.id}`)}
                  style={{ cursor: 'pointer' }}
                >
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
