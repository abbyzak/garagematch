'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'nl';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.services': 'Services',
    'nav.about': 'About',
    'nav.contact': 'Contact',
    'nav.login': 'Login',
    'nav.register': 'Register',
    'nav.dashboard': 'Dashboard',
    'nav.logout': 'Logout',

    // Auth
    'auth.login': 'Login',
    'auth.register': 'Register',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.name': 'Full Name',
    'auth.phone': 'Phone Number',
    'auth.role': 'Account Type',
    'auth.client': 'Client',
    'auth.garage_owner': 'Garage Owner',
    'auth.login_error': 'Invalid credentials',
    'auth.register_success': 'Registration successful',

    // Home
    'home.title': 'Find & Book Trusted Garages',
    'home.subtitle': 'Connect with professional garages for all your vehicle maintenance needs',
    'home.cta': 'Find a Garage',
    'home.plate_placeholder': 'Enter your license plate',

    // Vehicle
    'vehicle.lookup': 'Vehicle Lookup',
    'vehicle.details': 'Vehicle Details',
    'vehicle.brand': 'Brand',
    'vehicle.model': 'Model',
    'vehicle.year': 'Year',
    'vehicle.fuel': 'Fuel Type',
    'vehicle.continue': 'Continue to Booking',

    // Services
    'service.oil_change': 'Oil Change',
    'service.brake_service': 'Brake Service',
    'service.tire_service': 'Tire Service',
    'service.battery_service': 'Battery Service',
    'service.engine_diagnostic': 'Engine Diagnostic',

    // Common
    'common.loading': 'Loading...',
    'common.search': 'Search',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.view': 'View',
    'common.approve': 'Approve',
    'common.reject': 'Reject',
  },
  nl: {
    // Navigation
    'nav.home': 'Home',
    'nav.services': 'Diensten',
    'nav.about': 'Over Ons',
    'nav.contact': 'Contact',
    'nav.login': 'Inloggen',
    'nav.register': 'Registreren',
    'nav.dashboard': 'Dashboard',
    'nav.logout': 'Uitloggen',

    // Auth
    'auth.login': 'Inloggen',
    'auth.register': 'Registreren',
    'auth.email': 'E-mail',
    'auth.password': 'Wachtwoord',
    'auth.name': 'Volledige Naam',
    'auth.phone': 'Telefoonnummer',
    'auth.role': 'Account Type',
    'auth.client': 'Klant',
    'auth.garage_owner': 'Garage Eigenaar',
    'auth.login_error': 'Ongeldige inloggegevens',
    'auth.register_success': 'Registratie succesvol',

    // Home
    'home.title': 'Vind & Boek Betrouwbare Garages',
    'home.subtitle': 'Verbind met professionele garages voor al uw voertuigonderhoudsbehoeften',
    'home.cta': 'Vind een Garage',
    'home.plate_placeholder': 'Voer uw kenteken in',

    // Vehicle
    'vehicle.lookup': 'Voertuig Opzoeken',
    'vehicle.details': 'Voertuigdetails',
    'vehicle.brand': 'Merk',
    'vehicle.model': 'Model',
    'vehicle.year': 'Jaar',
    'vehicle.fuel': 'Brandstoftype',
    'vehicle.continue': 'Doorgaan naar Boeking',

    // Services
    'service.oil_change': 'Olie Verversen',
    'service.brake_service': 'Remservice',
    'service.tire_service': 'Bandenservice',
    'service.battery_service': 'Accuservice',
    'service.engine_diagnostic': 'Motor Diagnose',

    // Common
    'common.loading': 'Laden...',
    'common.search': 'Zoeken',
    'common.save': 'Opslaan',
    'common.cancel': 'Annuleren',
    'common.edit': 'Bewerken',
    'common.delete': 'Verwijderen',
    'common.view': 'Bekijken',
    'common.approve': 'Goedkeuren',
    'common.reject': 'Afwijzen',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}