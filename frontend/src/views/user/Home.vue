<template>
    <div class="home-container">
        <Navbar :username="username" @logout="showLogoutModal = true" />
    
    <section class="hero">
      <div class="hero-content">
        <div class="hero-text" v-motion-slide-visible-once-bottom>
          <h1>Welcome to <span class="brand-highlight">JM Garis Store</span></h1>
          <p>Your one-stop shop for quality beverages and grocery essentials</p>
          <div class="hero-buttons">
            <router-link to="/products" class="btn primary-btn">
              <i class="fas fa-shopping-bag"></i> Shop Now
            </router-link>
            <router-link to="/rewards" class="btn secondary-btn">
              <i class="fas fa-gift"></i> View Rewards
            </router-link>
          </div>
        </div>
        <div class="hero-image" v-motion-slide-visible-once-right>
          <img src="https://i.ibb.co/zVWcJ0Ln/GROCEREASE-home.png" alt="JM Garis Store" />
        </div>
      </div>
    </section>

      <!-- Download App Section -->
      <section class="download-app" v-motion-slide-visible-once-bottom>
        <div class="download-app-content">
          <div class="download-app-text">
            <h2><i class="fas fa-download"></i> Get the JM Garis Store App</h2>
            <p>Prefer using our app? Download the full JM Garis Store Vue application for a faster, more seamless experience!</p>
            <a
              href="/downloads/jm-garis-store-app.zip"
              class="btn download-btn"
              download
            >
              <i class="fas fa-cloud-download-alt"></i> Download App
            </a>
          </div>
          <div class="download-app-image">
            <img src="/img/icons/app-logo.png" alt="JM Garis Store App" />
          </div>
        </div>
      </section>

    <section class="categories" v-motion-slide-visible-once-bottom>
      <div class="section-header">
        <h2>Popular Categories</h2>
      </div>
      <div class="categories-grid">
        <div 
          v-for="(category, index) in categories" 
          :key="index" 
          class="category-card"
          @mouseenter="hoveredCategory = index"
          @mouseleave="hoveredCategory = null"
          :class="{ 'hovered': hoveredCategory === index }"
        >
          <div class="category-icon">
            <i :class="category.icon"></i>
          </div>
          <h3>{{ category.name }}</h3>
          <router-link :to="category.link" class="category-link">Browse Products</router-link>
        </div>
      </div>
    </section>

    <footer class="footer">
      <div class="footer-content">
        <div class="footer-section about">
          <h3>About JM Garis Store</h3>
          <p>Your trusted local store for quality groceries, beverages, and everyday essentials.</p>
          <div class="contact">
            <p><i class="fas fa-map-marker-alt"></i> Barcenaga, Naujan City, Oriental Mindoro</p>
            <p><i class="fas fa-phone"></i> +63 XXX XXX XXXX</p>
            <p><i class="fas fa-envelope"></i> storeofjmgaris@gmail.com</p>
          </div>
          <div class="socials">
            <a href="#"><i class="fab fa-facebook"></i></a>
            <a href="#"><i class="fab fa-instagram"></i></a>
            <a href="#"><i class="fab fa-twitter"></i></a>
          </div>
        </div>
        
        <div class="footer-section links">
          <h3>Quick Links</h3>
          <ul>
            <li><router-link to="/">Home</router-link></li>
            <li><router-link to="/products">Products</router-link></li>
            <li><router-link to="/rewards">Rewards</router-link></li>
            <li><router-link to="/cart">My Cart</router-link></li>
            <li><router-link to="/profile">My Account</router-link></li>
          </ul>
        </div>
        
        <div class="footer-section hours">
            <h3>Store Hours</h3>
            <p><i class="far fa-clock"></i> Monday - Saturday: 8:00 AM - 9:00 PM</p>
            <p><i class="far fa-clock"></i> Sunday: 9:00 AM - 7:00 PM</p>
            <p class="pickup-info"><i class="fas fa-shopping-bag"></i> In-store pickup and Hatid delivery</p>
            </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2025 JM Garis Store. All Rights Reserved.</p>
      </div>
    </footer>

    <LogoutModal 
      :show="showLogoutModal"
      @confirm="handleLogout"
      @cancel="showLogoutModal = false"
    />

    <!-- Back to top button -->
    <button 
      class="back-to-top" 
      @click="scrollToTop" 
      :class="{ 'visible': showBackToTop }"
    >
      <i class="fas fa-chevron-up"></i>
    </button>
  </div>
</template>
  
<script>
import Navbar from '../../components/Navbar.vue'
import LogoutModal from '../../components/LogoutModal.vue'
  
import { apiPost, apiGet, replaceLocalhostUrl } from '@/config/api'

export default {
  name: 'Home',
  components: {
    Navbar,
    LogoutModal
  },
  data() {
    return {
      username: '',
      showLogoutModal: false,
      hoveredCategory: null,
      showBackToTop: false,
      categories: [
        { name: 'Beverages', icon: 'fas fa-wine-bottle', link: '/products?category=Beverages' },
        { name: 'Canned Goods', icon: 'fas fa-shopping-basket', link: '/products?category=Canned Goods' },
        { name: 'Condiments', icon: 'fas fa-pepper-hot', link: '/products?category=Condiments' },
        { name: 'Milk & Chocolate', icon: 'fas fa-mug-hot', link: '/products?category=Milk and Chocolate Drink' }
      ]
    }
  },
  methods: {
    async handleLogout() {
      try {
        const token = localStorage.getItem('token');
        const response = await apiPost('/api/users/logout', {}, {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });

        if (response.ok) {
          localStorage.removeItem('token');
          this.$router.push('/login');
        } else {
          throw new Error('Logout failed');
        }
      } catch (error) {
        console.error('Error during logout:', error);
      } finally {
        this.showLogoutModal = false;
      }
    },
    async getUserData() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          this.$router.push('/login');
          return;
        }

        const response = await this.$fetch('/api/users/getUsername', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          this.username = data.username;
        }
      } catch (error) {
        console.error('Error fetching username:', error);
      }
    },
    handleScroll() {
      this.showBackToTop = window.scrollY > 300;
    },
    scrollToTop() {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  },
  async mounted() {
    await this.getUserData();
    window.addEventListener('scroll', this.handleScroll);
  },
  beforeUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
  },
  beforeMount() {
    const token = localStorage.getItem('token');
    if (!token) {
      this.$router.push('/login');
    }
  }
}
</script>
  
<style scoped>
.home-container {
    font-family: Arial, sans-serif;
    min-height: 100vh;
    color: #2a3f2a; /* Darker green text for contrast */
    width: 100%;
    margin: 0;
    padding: 0;
}

/* Download App Section */
.download-app {
  background-color: #e8f5e9;
  padding: 3rem 2rem;
  margin-bottom: 3rem;
  border-radius: 18px;
  box-shadow: 0 4px 16px rgba(76, 175, 80, 0.08);
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
}
.download-app-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
}
.download-app-text {
  flex: 1;
}
.download-app-text h2 {
  font-size: 2rem;
  color: #388e3c;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.download-app-text p {
  font-size: 1.1rem;
  color: #2c3e50;
  margin-bottom: 2rem;
}
.download-btn {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 1rem 2.5rem;
  border-radius: 50px;
  font-size: 1.1rem;
  font-weight: 600;
  box-shadow: 0 4px 10px rgba(76, 175, 80, 0.15);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.7rem;
  transition: background 0.3s, transform 0.3s;
}
.download-btn:hover {
  background-color: #388e3c;
  transform: translateY(-3px);
}
.download-app-image {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}
.download-app-image img {
  max-width: 220px;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(44, 62, 80, 0.08);
}

@media (max-width: 992px) {
  .download-app-content {
    flex-direction: column;
    text-align: center;
  }
  .download-app-image {
    margin-top: 2rem;
  }
}

/* Hero Section */
.hero {
  background-color: #f0f8f0;
  padding: 4rem 2rem;
  margin-bottom: 3rem;
  overflow: hidden;
  position: relative;
}

.hero::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('https://i.ibb.co/qKVjY0S/bg-home.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  opacity: 0.1;
  z-index: 0;
}

.hero-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.hero-text {
  flex: 1;
  max-width: 600px;
}

.hero-text h1 {
  font-size: 3rem;
  color: #2c3e50;
  margin-bottom: 1.5rem;
  line-height: 1.2;
}

.brand-highlight {
  color: #4CAF50;
  font-weight: bold;
}

.hero-text p {
  font-size: 1.2rem;
  color: #5d6d7e;
  margin-bottom: 2rem;
}

.hero-buttons {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn {
  padding: 0.875rem 2rem;
  border-radius: 50px;
  font-weight: 600;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  font-size: 1rem;
}

.primary-btn {
  background-color: #4CAF50;
  color: white;
  border: 2px solid transparent;
  box-shadow: 0 4px 6px rgba(76, 175, 80, 0.2);
}

.primary-btn:hover {
  background-color: #45a049;
  transform: translateY(-3px);
  box-shadow: 0 6px 12px rgba(76, 175, 80, 0.3);
}

.secondary-btn {
  background-color: white;
  color: #4CAF50;
  border: 2px solid #4CAF50;
}

.secondary-btn:hover {
  background-color: #f0f8f0;
  transform: translateY(-3px);
  box-shadow: 0 4px 8px rgba(76, 175, 80, 0.1);
}

.hero-image {
  flex: 1;
  display: flex;
  justify-content: center;
  animation: float 4s ease-in-out infinite;
}

.hero-image img {
  max-width: 100%;
  max-height: 400px;
  object-fit: contain;
  filter: drop-shadow(0 10px 15px rgba(0,0,0,0.1));
}

@keyframes float {
  0% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
  100% { transform: translateY(0); }
}

/* Categories Section */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.section-header h2 {
  font-size: 2rem;
  color: #2c3e50;
  position: relative;
}

.section-header h2::after {
  content: "";
  position: absolute;
  bottom: -10px;
  left: 0;
  width: 60px;
  height: 3px;
  background-color: #4CAF50;
  border-radius: 3px;
}

.categories, .featured-products {
  padding: 3rem 2rem;
  max-width: 1200px;
  margin: 0 auto 3rem;
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 2rem;
}

.category-card {
  background-color: white;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.category-card::before {
  content: "";
  position: absolute;
  top: -100%;
  left: -100%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(76, 175, 80, 0.1) 0%, rgba(255, 255, 255, 0) 70%);
  transition: transform 0.6s ease-in-out;
  transform: scale(0);
  z-index: 0;
}

.category-card:hover::before {
  transform: scale(1);
}

.category-card.hovered {
  transform: translateY(-10px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.1);
}

.category-icon {
  width: 70px;
  height: 70px;
  margin: 0 auto 1.5rem;
  background-color: #f0f8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 1.8rem;
  color: #4CAF50;
  transition: all 0.3s ease;
}

.category-card:hover .category-icon {
  background-color: #4CAF50;
  color: white;
  transform: scale(1.1);
}

.category-card h3 {
  margin: 0 0 1rem;
  color: #2c3e50;
  font-size: 1.2rem;
}

.category-link {
  color: #4CAF50;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9rem;
  display: inline-flex;
  align-items: center;
  position: relative;
  transition: all 0.3s ease;
}

.category-link::after {
  content: "";
  position: absolute;
  bottom: -3px;
  left: 0;
  width: 0;
  height: 2px;
  background-color: #4CAF50;
  transition: width 0.3s ease;
}

.category-card:hover .category-link::after {
  width: 100%;
}

/* Featured Products - Enhanced */
.view-all {
  color: #4CAF50;
  text-decoration: none;
  font-weight: 600;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.view-all:hover {
  color: #45a049;
  transform: translateX(5px);
}

.products-slider {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
  gap: 2rem;
}

.product-card {
  background-color: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  transition: all 0.3s ease;
  position: relative;
  cursor: pointer;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.product-badge {
  position: absolute;
  top: 15px;
  left: 15px;
  background-color: #4CAF50;
  color: white;
  padding: 0.4rem 0.8rem;
  border-radius: 30px;
  font-size: 0.8rem;
  font-weight: 600;
  z-index: 2;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.product-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 15px 30px rgba(0,0,0,0.1);
}

.product-card::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, rgba(255,255,255,0) 70%, rgba(255,255,255,0.8) 100%);
  z-index: 1;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.product-card:hover::after {
  opacity: 1;
}

.product-image {
  height: 260px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background-color: #f8f9fa;
  overflow: hidden;
  position: relative;
}

.product-image img {
  max-height: 100%;
  max-width: 100%;
  object-fit: contain;
  transition: transform 0.5s ease;
  z-index: 1;
}

.product-card:hover .product-image img {
  transform: scale(1.08);
}

.product-info {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  flex: 1;
  position: relative;
  z-index: 2;
}

.product-info h3 {
  margin: 0 0 0.8rem;
  color: #2c3e50;
  font-size: 1.2rem;
  font-weight: 600;
  line-height: 1.4;
}

.product-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
}

.product-price {
  color: #4CAF50;
  font-weight: 700;
  font-size: 1.3rem;
  margin: 0;
}

.product-rating {
  display: flex;
  color: #ffc107;
  font-size: 0.9rem;
}

.product-rating i {
  margin-left: 2px;
}

/* Footer */
.footer {
  background-color: #2c3e50;
  color: #ecf0f1;
  padding: 3rem 2rem 1rem;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
}

.footer-section h3 {
  color: #4CAF50;
  margin-bottom: 1.5rem;
  position: relative;
}

.footer-section h3::after {
  content: "";
  position: absolute;
  bottom: -8px;
  left: 0;
  width: 40px;
  height: 2px;
  background-color: #4CAF50;
}

.about p {
  margin-bottom: 1rem;
  line-height: 1.6;
}

.contact {
  margin-top: 1.5rem;
}

.contact p {
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.socials {
  margin-top: 1.5rem;
  display: flex;
  gap: 1rem;
}

.socials a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #34495e;
  color: white;
  font-size: 1.2rem;
  transition: all 0.3s ease;
}

.socials a:hover {
  background-color: #4CAF50;
  transform: translateY(-3px);
}

.links ul {
  list-style: none;
  padding: 0;
}

.links li {
  margin-bottom: 1rem;
}

.links a {
  color: #ecf0f1;
  text-decoration: none;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.links a::before {
  content: "➤";
  font-size: 0.8rem;
  opacity: 0;
  transform: translateX(-10px);
  transition: all 0.3s ease;
}

.links a:hover {
  color: #4CAF50;
  padding-left: 8px;
}

.links a:hover::before {
  opacity: 1;
  transform: translateX(-5px);
}

.hours p {
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.pickup-info {
  margin-top: 1.5rem;
  padding: 0.75rem;
  background-color: #34495e;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
}
.footer-bottom {
  max-width: 1200px;
  margin: 0 auto;
  padding-top: 2rem;
  border-top: 1px solid #34495e;
  margin-top: 2rem;
  text-align: center;
  font-size: 0.9rem;
  color: #bdc3c7;
}

/* Back to Top Button */
.back-to-top {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: #4CAF50;
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.3s ease;
  z-index: 999;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}

.back-to-top.visible {
  opacity: 1;
  transform: translateY(0);
}

.back-to-top:hover {
  background-color: #45a049;
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(0,0,0,0.15);
}

/* Responsive Design */
@media (max-width: 992px) {
  .hero-content {
    flex-direction: column;
    text-align: center;
  }
  
  .hero-text {
    margin-bottom: 3rem;
  }
  
  .hero-buttons {
    justify-content: center;
  }

  .section-header h2::after {
    left: 50%;
    transform: translateX(-50%);
  }
  
  .section-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
}

@media (max-width: 768px) {
  .hero {
    padding: 2rem 1rem;
  }
  
  .hero-text h1 {
    font-size: 1.8rem;
  }
  
  .hero-text p {
    font-size: 1rem;
  }
  
  .hero-buttons {
    flex-direction: column;
    align-items: center;
  }
  
  .btn {
    width: 100%;
    max-width: 250px;
    justify-content: center;
  }
  
  .categories, .featured-products {
    padding: 2rem 1rem;
  }
  
  .categories-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .products-slider {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .product-card {
    max-width: 100%;
  }
  
  .footer-content {
    grid-template-columns: 1fr;
  }
  
  .footer-section {
    text-align: center;
  }
  
  .footer-section h3::after {
    left: 50%;
    transform: translateX(-50%);
  }
  
  .contact p, .hours p {
    justify-content: center;
  }
  
  .socials {
    justify-content: center;
  }
  
  .links ul {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1rem;
  }
  
  .links li {
    margin-bottom: 0;
  }
}

@media (max-width: 480px) {
  .hero-text h1 {
    font-size: 1.5rem;
  }
  
  .hero-text p {
    font-size: 0.9rem;
  }
  
  .hero-image img {
    max-height: 250px;
  }
  
  .categories-grid {
    gap: 0.5rem;
  }
  
  .category-card {
    padding: 1.5rem;
  }
  
  .products-slider {
    gap: 0.5rem;
  }
  
  .product-card {
    padding: 1rem;
  }
  
  .product-image {
    height: 200px;
  }
  
  .footer {
    padding: 2rem 1rem 1rem;
  }
}
</style>

