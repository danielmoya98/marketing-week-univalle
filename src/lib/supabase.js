import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const isConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('tu-proyecto') && 
  !supabaseAnonKey.includes('tu-anon-key')
);

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Categorías oficiales de competencia
export const FALLBACK_CATEGORIAS = [
  { id: 'botargas', nombre: 'Carrera de botargas', color: '#FE7B00' },
  { id: 'stands', nombre: 'Decoración de stands', color: '#101010' },
  { id: 'enbanderamiento', nombre: 'Embanderamiento', color: '#FE6E02' }
];

// Estructura de equipos vacía por defecto
export const FALLBACK_EQUIPOS = {
  botargas: [],
  stands: [],
  enbanderamiento: []
};

// Validación oficial: 7 números antes del arroba y dominio @est.univalle.edu o @univalle.edu
export const UNIVALLE_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]*[0-9]{7}@(est\.)?univalle\.edu$/i;

export function isValidUnivalleEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return UNIVALLE_EMAIL_REGEX.test(email.trim());
}
