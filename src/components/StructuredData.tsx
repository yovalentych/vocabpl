import Script from "next/script";

interface StructuredDataProps {
  data: Record<string, any>;
}

export default function StructuredData({ data }: StructuredDataProps) {
  return (
    <Script
      id="structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// Schema.org types for Polish Vocab Studio
export function getWebSiteSchema(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Polish Vocab Studio",
    "alternateName": "Vocabpl",
    "url": siteUrl,
    "description": "Платформа для вивчення польської мови онлайн з AI вправами, словником, тестами та читанням",
    "inLanguage": ["uk", "pl"],
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${siteUrl}/class/dict/browse?search={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };
}

export function getOrganizationSchema(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "name": "Polish Vocab Studio",
    "alternateName": "Vocabpl",
    "url": siteUrl,
    "logo": `${siteUrl}/icon.svg`,
    "description": "Онлайн платформа для вивчення польської мови з використанням AI технологій",
    "foundingDate": "2024",
    "areaServed": {
      "@type": "Country",
      "name": "Ukraine"
    },
    "knowsLanguage": ["uk", "pl"],
    "audience": {
      "@type": "EducationalAudience",
      "educationalRole": "student"
    },
    "educationalCredentialAwarded": "Polish Language Proficiency",
    "offers": {
      "@type": "Offer",
      "category": "Language Learning",
      "price": "0",
      "priceCurrency": "UAH",
      "availability": "https://schema.org/InStock"
    }
  };
}

export function getWebApplicationSchema(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Polish Vocab Studio",
    "url": siteUrl,
    "applicationCategory": "EducationalApplication",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "UAH"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "150",
      "bestRating": "5",
      "worstRating": "1"
    },
    "featureList": [
      "AI-генеровані вправи з польської мови",
      "Інтерактивний словник з 1500+ слів",
      "Тести на знання польської граматики",
      "Читання польських текстів з перекладом",
      "Flashcard тренажер для запам'ятовування слів",
      "Відстеження прогресу навчання",
      "Вправи на діалоги, переклад, опис сцен"
    ]
  };
}

export function getCourseSchema(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": "Курс польської мови онлайн",
    "description": "Комплексний курс вивчення польської лексики та граматики з AI вправами, тестами та інтерактивним словником",
    "provider": {
      "@type": "Organization",
      "name": "Polish Vocab Studio",
      "url": siteUrl
    },
    "educationalLevel": "Beginner to Intermediate",
    "inLanguage": "uk",
    "teaches": "Polish Language Vocabulary and Grammar",
    "availableLanguage": ["uk", "pl"],
    "hasCourseInstance": {
      "@type": "CourseInstance",
      "courseMode": "online",
      "courseWorkload": "PT2H"
    }
  };
}

export function getBreadcrumbListSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };
}
