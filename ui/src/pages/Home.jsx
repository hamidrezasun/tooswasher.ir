/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import CategoryPopup from '../components/CategoryPopup';
import { getOptionByName } from '../api/api';

const Home = () => {
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [titleDescription, setTitleDescription] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');
  const [companyColorCode, setCompanyColorCode] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const companyNameOption = await getOptionByName('company_name');
        const titleDescriptionOption = await getOptionByName('title_description');
        const companyDescriptionOption = await getOptionByName('company_description');
        const companyColorCodeOption = await getOptionByName('company_color_code');

        if (companyNameOption) setCompanyName(companyNameOption.option_value);
        if (titleDescriptionOption) setTitleDescription(titleDescriptionOption.option_value);
        if (companyDescriptionOption) setCompanyDescription(companyDescriptionOption.option_value);
        if (companyColorCodeOption) setCompanyColorCode(companyColorCodeOption.option_value);
      } catch (error) {
        console.error('Failed to fetch options:', error);
      }
    };
    fetchData();
  }, []);

  // Apply dynamic styles
    const dynamicHeroStyles = css`
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 4rem 1rem 2rem;
    background: linear-gradient(135deg, ${companyColorCode}, ${adjustColor(companyColorCode, -30)});
    color: white;
    position: relative;
    overflow: hidden;

    @media (min-width: 768px) {
        flex-direction: row-reverse;
        min-height: 80vh;
        padding: 4rem 2rem;
    }
    `;

    // Helper function to adjust color brightness
    function adjustColor(color, amount) {
        let R = parseInt(color.substring(1, 3), 16);
        let G = parseInt(color.substring(3, 5), 16);
        let B = parseInt(color.substring(5, 7), 16);

        R = R + amount;
        G = G + amount;
        B = B + amount;

        R = (R < 0) ? 0 : ((R > 255) ? 255 : R);
        G = (G < 0) ? 0 : ((G > 255) ? 255 : G);
        B = (B < 0) ? 0 : ((B > 255) ? 255 : B);

        const RR = ((R.toString(16).length === 1) ? "0" + R.toString(16) : R.toString(16));
        const GG = ((G.toString(16).length === 1) ? "0" + G.toString(16) : G.toString(16));
        const BB = ((B.toString(16).length === 1) ? "0" + B.toString(16) : B.toString(16));

        return "#" + RR + GG + BB;
    }

  return (
    <div css={containerStyles}>
      <Navbar />
      
      {/* Hero Section */}
      <section css={dynamicHeroStyles}>
        <div css={heroContent}>
          <h1 css={heroTitle}>{companyName}</h1>
          <p css={heroSubtitle}>{titleDescription}</p>
          <div css={buttonGroup}>
            <button 
              onClick={() => setIsCategoryOpen(true)}
              css={primaryButton}
            >
              مشاهده محصولات
            </button>
            <button css={secondaryButton}>
              تماس با ما
            </button>
          </div>
        </div>
        <div css={heroImage}>
          <img 
            src="/images/hero-washer.jpg" 
            alt="واشرهای صنعتی" 
            css={imageStyle}
          />
        </div>
      </section>

      {/* Company Intro Section */}
      <section css={introSection}>
        <div css={introContent}>
          <h2 css={sectionTitle}>معرفی {companyName}</h2>
          <p css={introText}>
            {companyDescription}
          </p>
        </div>
      </section>

      {/* Categories Section */}
      <section css={categoriesSection}>
        <h2 css={sectionTitle}>دسته‌بندی محصولات</h2>
        <div css={categoriesGrid}>
          {categories.map((category, index) => (
            <div key={index} css={categoryCard}>
              <img 
                src={category.image} 
                alt={category.title} 
                css={categoryImage}
              />
              <h3 css={categoryTitle}>{category.title}</h3>
              <p css={categoryDescription}>{category.description}</p>
              <button css={categoryButton}>مشاهده جزئیات</button>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section css={featuresSection}>
        <h2 css={sectionTitle}>چرا ما را انتخاب کنید؟</h2>
        <div css={featuresGrid}>
          {features.map((feature, index) => (
            <div key={index} css={featureCard}>
              <div css={featureIcon}>{feature.icon}</div>
              <h3 css={featureTitle}>{feature.title}</h3>
              <p css={featureDescription}>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section css={ctaSection}>
        <h2 css={ctaTitle}>همکاری با {companyName}</h2>
        <p css={ctaText}>برای سفارش محصولات یا دریافت مشاوره با ما در تماس باشید</p>
        <button css={[primaryButton, ctaButton]}>
          درخواست مشاوره
        </button>
      </section>

      {isCategoryOpen && <CategoryPopup onClose={() => setIsCategoryOpen(false)} />}
    </div>
  );
};

// Data
const features = [
  { icon: '⚙️', title: 'کیفیت ممتاز', description: 'استفاده از بهترین مواد اولیه' },
  { icon: '⏱️', title: 'تحویل به‌موقع', description: 'ارسال سریع به سراسر کشور' },
  { icon: '🤝', title: 'پشتیبانی حرفه‌ای', description: 'مشاوره و خدمات پس از فروش' },
];

const categories = [
  {
    image: '/images/flat-washers.jpg',
    title: 'واشرهای تخت',
    description: 'مناسب برای کاربردهای عمومی صنعتی'
  },
  {
    image: '/images/spring-washers.jpg',
    title: 'واشرهای فنری',
    description: 'ایده‌آل برای اتصالات با لرزش بالا'
  },
  {
    image: '/images/sealing-washers.jpg',
    title: 'واشرهای آب‌بندی',
    description: 'مناسب برای جلوگیری از نشتی'
  },
];

// Styles
const containerStyles = css`
  font-family: 'Vazir', sans-serif;
  direction: rtl;
  background: #f9fafb;
`;

const heroContent = css`
  flex: 1;
  padding: 2rem;
  text-align: right;
  z-index: 1;
`;

const heroTitle = css`
  font-size: 2rem;
  font-weight: 800;
  margin-bottom: 1rem;
  line-height: 1.2;
  
  @media (min-width: 768px) {
    font-size: 3rem;
  }
`;

const heroSubtitle = css`
  font-size: 1.1rem;
  opacity: 0.9;
  margin-bottom: 2rem;
  
  @media (min-width: 768px) {
    font-size: 1.25rem;
  }
`;

const heroImage = css`
  flex: 1;
  padding: 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const imageStyle = css`
  max-width: 100%;
  height: auto;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
`;

const buttonGroup = css`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
`;

const buttonBase = css`
  padding: 0.8rem 2rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  font-size: 1rem;
`;

const primaryButton = css`
  ${buttonBase}
  background-color: #ffffff;
  color: #dc2626;
  
  &:hover {
    background-color: #f3f4f6;
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
  }
`;

const secondaryButton = css`
  ${buttonBase}
  background-color: transparent;
  color: white;
  border: 2px solid white;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

const introSection = css`
  padding: 3rem 1rem;
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
  background: white;
  border-radius: 12px;
  margin-top: -2rem;
  position: relative;
  z-index: 1;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);

  @media (min-width: 768px) {
    padding: 4rem 2rem;
  }
`;

const introContent = css`
  max-width: 800px;
  margin: 0 auto;
`;

const sectionTitle = css`
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  color: #b91c1c;
  
  @media (min-width: 768px) {
    font-size: 2.2rem;
  }
`;

const introText = css`
  color: #4b5563;
  line-height: 1.8;
  font-size: 1rem;
  
  @media (min-width: 768px) {
    font-size: 1.1rem;
  }
`;

const categoriesSection = css`
  padding: 3rem 1rem;
  max-width: 1200px;
  margin: 0 auto;
  
  @media (min-width: 768px) {
    padding: 4rem 2rem;
  }
`;

const categoriesGrid = css`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  
  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const categoryCard = css`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  text-align: center;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  }
`;

const categoryImage = css`
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 1rem;
`;

const categoryTitle = css`
  font-size: 1.2rem;
  font-weight: 600;
  color: #b91c1c;
  margin-bottom: 0.5rem;
`;

const categoryDescription = css`
  color: #6b7280;
  font-size: 0.95rem;
  margin-bottom: 1rem;
`;

const categoryButton = css`
  ${buttonBase}
  background-color: #dc2626;
  color: white;
  padding: 0.6rem 1.5rem;
  
  &:hover {
    background-color: #b91c1c;
  }
`;

const featuresSection = css`
  padding: 3rem 1rem;
  background: #fef2f2;
  margin: 0 auto;
  max-width: 1200px;
  
  @media (min-width: 768px) {
    padding: 4rem 2rem;
  }
`;

const featuresGrid = css`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  
  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const featureCard = css`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
`;

const featureIcon = css`
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: #dc2626;
`;

const featureTitle = css`
  font-size: 1.2rem;
  font-weight: 600;
  color: #b91c1c;
  margin-bottom: 0.5rem;
`;

const featureDescription = css`
  color: #6b7280;
  font-size: 0.95rem;
`;

const ctaSection = css`
  background: linear-gradient(135deg, #dc2626, #b91c1c);
  color: white;
  padding: 3rem 1rem;
  text-align: center;
  
  @media (min-width: 768px) {
    padding: 4rem 2rem;
  }
`;

const ctaTitle = css`
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 1rem;
  
  @media (min-width: 768px) {
    font-size: 2rem;
  }
`;

const ctaText = css`
  font-size: 1.1rem;
  opacity: 0.9;
  margin-bottom: 2rem;
`;

const ctaButton = css`
  padding: 1rem 3rem;
  font-size: 1.1rem;
`;

export default Home;