/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import { useState, useEffect, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';

// Lazy load heavy components
const Navbar = lazy(() => import('../components/Navbar'));
const CategoryPopup = lazy(() => import('../components/CategoryPopup'));

// Utility functions
const adjustColor = (color, amount) => {
  if (!color) return '#ffffff';
  
  let R = parseInt(color.substring(1, 3), 16);
  let G = parseInt(color.substring(3, 5), 16);
  let B = parseInt(color.substring(5, 7), 16);

  R = Math.max(0, Math.min(255, R + amount));
  G = Math.max(0, Math.min(255, G + amount));
  B = Math.max(0, Math.min(255, B + amount));

  const toHex = num => num.toString(16).padStart(2, '0');
  return `#${toHex(R)}${toHex(G)}${toHex(B)}`;
};

// Static data
const FEATURES = [
  { icon: '⚙️', title: 'کیفیت ممتاز', description: 'استفاده از بهترین مواد اولیه' },
  { icon: '⏱️', title: 'تحویل به‌موقع', description: 'ارسال سریع به سراسر کشور' },
  { icon: '🤝', title: 'پشتیبانی حرفه‌ای', description: 'مشاوره و خدمات پس از فروش' },
];

const STANDARDS = [
  { image: '/images/iso-9001.png', title: 'ISO 9001' },
  { image: '/images/iso-14001.png', title: 'ISO 14001' },
  { image: '/images/ce-marking.png', title: 'CE Marking' },
  { image: '/images/tuv-certified.png', title: 'TÜV Certified' },
];

const Home = () => {
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [titleDescription, setTitleDescription] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');
  const [companyColorCode, setCompanyColorCode] = useState('#b91c1c');
  const [logoUrl, setLogoUrl] = useState('');
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Dynamically import API functions
        const { getOptionByName, getCategories } = await import('../api/api');
        
        const [
          companyNameOption,
          titleDescriptionOption,
          companyDescriptionOption,
          companyColorCodeOption,
          logoUrlOption,
          categoriesData
        ] = await Promise.all([
          getOptionByName('company_name'),
          getOptionByName('title_description'),
          getOptionByName('company_description'),
          getOptionByName('company_color_code'),
          getOptionByName('logo_url'),
          getCategories()
        ]);

        setCompanyName(companyNameOption?.option_value || '');
        setTitleDescription(titleDescriptionOption?.option_value || '');
        setCompanyDescription(companyDescriptionOption?.option_value || '');
        setCompanyColorCode(companyColorCodeOption?.option_value || '#b91c1c');
        setLogoUrl(logoUrlOption?.option_value || '');
        setCategories(categoriesData.filter(category => !category.parent_id));
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Dynamic styles based on company color
  const dynamicStyles = {
    hero: css`
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
    `,
    sectionTitle: css`
      font-size: 1.8rem;
      font-weight: 700;
      margin-bottom: 1.5rem;
      color: ${companyColorCode};

      @media (min-width: 768px) {
        font-size: 2.2rem;
      }
    `,
    categoryTitle: css`
      font-size: 1.2rem;
      font-weight: 600;
      color: ${companyColorCode};
      margin-bottom: 0.5rem;
    `,
    featureTitle: css`
      font-size: 1.2rem;
      font-weight: 600;
      color: ${companyColorCode};
      margin-bottom: 0.5rem;
    `,
    featureIcon: css`
      font-size: 2.5rem;
      margin-bottom: 1rem;
      color: ${companyColorCode};
    `,
    standardTitle: css`
      font-size: 1.2rem;
      font-weight: 600;
      color: ${companyColorCode};
      margin-top: 0.5rem;
    `,
    instagramLink: css`
      color: ${companyColorCode};
      font-weight: 600;
      font-size: 1.2rem;
      text-decoration: none;
      transition: color 0.3s ease;

      &:hover {
        color: ${adjustColor(companyColorCode, -30)};
      }
    `,
    primaryButton: css`
      padding: 0.8rem 2rem;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      border: none;
      font-size: 1rem;
      background-color: #ffffff;
      color: ${companyColorCode};

      &:hover {
        background-color: ${adjustColor(companyColorCode, 80)};
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
      }
    `,
    categoryButton: css`
      padding: 0.6rem 1.5rem;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      border: none;
      font-size: 1rem;
      background-color: ${companyColorCode};
      color: white;

      &:hover {
        background-color: ${adjustColor(companyColorCode, -30)};
      }
    `,
    ctaSection: css`
      background: linear-gradient(135deg, ${companyColorCode}, ${adjustColor(companyColorCode, -30)});
      color: white;
      padding: 3rem 1rem;
      text-align: center;

      @media (min-width: 768px) {
        padding: 4rem 2rem;
      }
    `,
  };

  // Static styles
  const staticStyles = {
    container: css`
      font-family: 'Vazir', sans-serif;
      direction: rtl;
      background: #f9fafb;
      padding-top: 130px;
    `,
    heroContent: css`
      flex: 1;
      padding: 2rem;
      text-align: right;
      z-index: 1;
    `,
    heroTitle: css`
      font-size: 2rem;
      font-weight: 800;
      margin-bottom: 1rem;
      line-height: 1.2;

      @media (min-width: 768px) {
        font-size: 3rem;
      }
    `,
    heroSubtitle: css`
      font-size: 1.1rem;
      opacity: 0.9;
      margin-bottom: 2rem;

      @media (min-width: 768px) {
        font-size: 1.25rem;
      }
    `,
    heroImage: css`
      flex: 1;
      padding: 1rem;
      display: flex;
      justify-content: center;
      align-items: center;
    `,
    imageStyle: css`
      max-width: 100%;
      height: auto;
      border-radius: 12px;
    `,
    grayLogo: css`
      filter: grayscale(100%);
    `,
    buttonGroup: css`
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    `,
    secondaryButton: css`
      padding: 0.8rem 2rem;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      border: 2px solid white;
      font-size: 1rem;
      background-color: transparent;
      color: white;

      &:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }
    `,
    introSection: css`
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
    `,
    introContent: css`
      max-width: 800px;
      margin: 0 auto;
    `,
    introText: css`
      color: #4b5563;
      line-height: 1.8;
      font-size: 1rem;

      @media (min-width: 768px) {
        font-size: 1.1rem;
      }
    `,
    categoriesSection: css`
      padding: 3rem 1rem;
      max-width: 1200px;
      margin: 0 auto;
      position: relative;
      text-align: center;

      @media (min-width: 768px) {
        padding: 4rem 2rem;
      }
    `,
    categoriesContainer: css`
      width: 100%;
      overflow-x: auto;
      position: relative;
      margin-top: 2rem;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
      &::-webkit-scrollbar {
        display: none;
      }
    `,
    categoriesTrack: css`
      display: flex;
      gap: 1.5rem;
      padding: 1rem 0;
      animation: scroll 30s linear infinite;
      width: max-content;

      @keyframes scroll {
        0% { transform: translateX(50%); }
        100% { transform: translateX(0); }
      }

      &:hover {
        animation-play-state: paused;
      }
    `,
    categoryCard: css`
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;
      text-align: center;
      min-width: 250px;
      flex-shrink: 0;

      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      }
    `,
    categoryImage: css`
      max-width: 100%;
      max-height: 150px;
      width: auto;
      height: auto;
      object-fit: contain;
      border-radius: 8px;
      margin-bottom: 1rem;
      display: block;
      margin-left: auto;
      margin-right: auto;
    `,
    categoryDescription: css`
      color: #6b7280;
      font-size: 0.95rem;
      margin-bottom: 1rem;
    `,
    featuresSection: css`
      padding: 3rem 1rem;
      background: #fef2f2;
      margin: 0 auto;
      max-width: 1200px;

      @media (min-width: 768px) {
        padding: 4rem 2rem;
      }
    `,
    featuresGrid: css`
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.5rem;

      @media (min-width: 768px) {
        grid-template-columns: repeat(3, 1fr);
      }
    `,
    featureCard: css`
      background: white;
      border-radius: 12px;
      padding: 2rem;
      text-align: center;
    `,
    featureDescription: css`
      color: #6b7280;
      font-size: 0.95rem;
    `,
    standardsSection: css`
      padding: 3rem 1rem;
      max-width: 1200px;
      margin: 0 auto;
      text-align: center;
      background: white;

      @media (min-width: 768px) {
        padding: 4rem 2rem;
      }
    `,
    standardsGrid: css`
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1.5rem;
      margin-top: 2rem;
    `,
    standardCard: css`
      background: #f9fafb;
      border-radius: 12px;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      }
    `,
    standardImage: css`
      width: 80px;
      height: 80px;
      object-fit: contain;
      margin-bottom: 0.5rem;
    `,
    instagramSection: css`
      padding: 2rem 1rem;
      max-width: 1200px;
      margin: 0 auto;
      text-align: center;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);

      @media (min-width: 768px) {
        padding: 3rem 2rem;
      }
    `,
    instagramText: css`
      font-size: 1.2rem;
      color: #4b5563;
      margin-bottom: 1rem;
    `,
    instagramIcon: css`
      font-size: 2rem;
      margin-right: 0.5rem;
      vertical-align: middle;
    `,
    ctaTitle: css`
      font-size: 1.8rem;
      font-weight: 700;
      margin-bottom: 1rem;

      @media (min-width: 768px) {
        font-size: 2rem;
      }
    `,
    ctaText: css`
      font-size: 1.1rem;
      opacity: 0.9;
      margin-bottom: 2rem;
    `,
    ctaButton: css`
      padding: 1rem 3rem;
      font-size: 1.1rem;
    `,
    footer: css`
      padding: 2rem 1rem;
      text-align: center;
      background: #f9fafb;
    `,
    loadingIndicator: css`
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      font-size: 1.5rem;
    `,
  };

  if (isLoading) {
    return (
      <div css={staticStyles.loadingIndicator}>
        در حال بارگذاری...
      </div>
    );
  }

  return (
    <div css={staticStyles.container}>
      <Suspense fallback={<div css={css`min-height: 80px;`} />}>
        <Navbar />
      </Suspense>

      <section css={dynamicStyles.hero}>
        <div css={staticStyles.heroContent}>
          <h1 css={staticStyles.heroTitle}>{companyName}</h1>
          <p css={staticStyles.heroSubtitle}>{titleDescription}</p>
          <div css={staticStyles.buttonGroup}>
            <button
              onClick={() => setIsCategoryOpen(true)}
              css={dynamicStyles.primaryButton}
            >
              مشاهده محصولات
            </button>
            <button css={staticStyles.secondaryButton}>
              تماس با ما
            </button>
          </div>
        </div>
        <div css={staticStyles.heroImage}>
          {logoUrl && (
            <img
              src={logoUrl}
              alt={companyName}
              css={[staticStyles.imageStyle, staticStyles.grayLogo]}
              loading="lazy"
            />
          )}
        </div>
      </section>

      <section css={staticStyles.introSection}>
        <div css={staticStyles.introContent}>
          <h2 css={dynamicStyles.sectionTitle}>معرفی {companyName}</h2>
          <p css={staticStyles.introText}>{companyDescription}</p>
        </div>
      </section>

      <section css={staticStyles.categoriesSection}>
        <h2 css={dynamicStyles.sectionTitle}>دسته‌بندی محصولات</h2>
        <div css={staticStyles.categoriesContainer}>
          <div css={staticStyles.categoriesTrack}>
            {categories.map((category) => (
              <div key={category.id} css={staticStyles.categoryCard}>
                {category.image_url && (
                  <img
                    src={category.image_url}
                    alt={category.name}
                    css={staticStyles.categoryImage}
                    loading="lazy"
                  />
                )}
                <h3 css={dynamicStyles.categoryTitle}>{category.name}</h3>
                <p css={staticStyles.categoryDescription}>{category.description}</p>
                <Link to={`/categories/${category.id}`}>
                  <button css={dynamicStyles.categoryButton}>مشاهده جزئیات</button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section css={staticStyles.featuresSection}>
        <h2 css={dynamicStyles.sectionTitle}>چرا ما را انتخاب کنید؟</h2>
        <div css={staticStyles.featuresGrid}>
          {FEATURES.map((feature, index) => (
            <div key={index} css={staticStyles.featureCard}>
              <div css={dynamicStyles.featureIcon}>{feature.icon}</div>
              <h3 css={dynamicStyles.featureTitle}>{feature.title}</h3>
              <p css={staticStyles.featureDescription}>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section css={staticStyles.standardsSection}>
        <h2 css={dynamicStyles.sectionTitle}>استانداردها</h2>
        <div css={staticStyles.standardsGrid}>
          {STANDARDS.map((standard, index) => (
            <div key={index} css={staticStyles.standardCard}>
              <img
                src={standard.image}
                alt={standard.title}
                css={staticStyles.standardImage}
                loading="lazy"
              />
              <h3 css={dynamicStyles.standardTitle}>{standard.title}</h3>
            </div>
          ))}
        </div>
      </section>

      <section css={staticStyles.instagramSection}>
        <p css={staticStyles.instagramText}>
          <span css={staticStyles.instagramIcon}>📷</span>
          ما را در اینستاگرام دنبال کنید
        </p>
        <a
          href="https://www.instagram.com/tooswasher"
          target="_blank"
          rel="noopener noreferrer"
          css={dynamicStyles.instagramLink}
        >
          @tooswasher
        </a>
      </section>

      <section css={dynamicStyles.ctaSection}>
        <h2 css={staticStyles.ctaTitle}>همکاری با {companyName}</h2>
        <p css={staticStyles.ctaText}>برای سفارش محصولات یا دریافت مشاوره با ما در تماس باشید</p>
        <button css={[dynamicStyles.primaryButton, staticStyles.ctaButton]}>
          درخواست مشاوره
        </button>
      </section>

      <footer css={staticStyles.footer}>
        <a
          referrerPolicy="origin"
          target="_blank"
          href="https://trustseal.enamad.ir/?id=596944&Code=Xgh9jXNIP8Bykb5ncY2s7pAMzUMyAPkd"
        >
          <img
            referrerPolicy="origin"
            src="https://trustseal.enamad.ir/logo.aspx?id=596944&Code=Xgh9jXNIP8Bykb5ncY2s7pAMzUMyAPkd"
            alt="Trust Seal"
            css={css`cursor: pointer;`}
          />
        </a>
      </footer>

      <Suspense fallback={null}>
        {isCategoryOpen && <CategoryPopup onClose={() => setIsCategoryOpen(false)} />}
      </Suspense>
    </div>
  );
};

export default Home;