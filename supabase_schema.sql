-- =====================================================================
-- MARKETING WEEK UNIVALLE - ESQUEMA DE BASE DE DATOS Y TIEMPO REAL
-- =====================================================================

-- 1. Crear tabla de categorías
CREATE TABLE IF NOT EXISTS public.categorias (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    color TEXT NOT NULL,
    orden INT DEFAULT 0
);

-- 2. Crear tabla de grupos (registro general de equipos inscritos)
CREATE TABLE IF NOT EXISTS public.grupos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre TEXT NOT NULL,
    lider TEXT NOT NULL,
    correo_lider TEXT NOT NULL,
    integrantes INT DEFAULT 1,
    color TEXT DEFAULT '#FE7B00',
    categorias TEXT[] NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Validar formato estricto de correo: 7 números antes de @ y dominios @est.univalle.edu o @univalle.edu
    CONSTRAINT check_correo_lider_univalle 
        CHECK (correo_lider ~* '^[a-z0-9._%+-]*[0-9]{7}@(est\.)?univalle\.edu$')
);

-- 3. Crear tabla de equipos (filas por categoría en competencia)
CREATE TABLE IF NOT EXISTS public.equipos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    grupo_id UUID REFERENCES public.grupos(id) ON DELETE CASCADE,
    categoria_id TEXT NOT NULL REFERENCES public.categorias(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    color TEXT NOT NULL,
    orden INT DEFAULT 0
);

-- 4. Crear tabla de votos
CREATE TABLE IF NOT EXISTS public.votos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    grupo_id UUID REFERENCES public.grupos(id) ON DELETE CASCADE,
    categoria_id TEXT NOT NULL REFERENCES public.categorias(id) ON DELETE CASCADE,
    equipo_id UUID NOT NULL REFERENCES public.equipos(id) ON DELETE CASCADE,
    correo_institucional TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Validar formato estricto: 7 números antes de @ y dominios @est.univalle.edu o @univalle.edu
    CONSTRAINT check_correo_univalle 
        CHECK (correo_institucional ~* '^[a-z0-9._%+-]*[0-9]{7}@(est\.)?univalle\.edu$'),
        
    -- Restricción 1: Máximo 1 voto por categoría por persona
    CONSTRAINT unique_voto_por_categoria 
        UNIQUE (correo_institucional, categoria_id),

    -- Restricción 2: Máximo 1 voto por equipo (grupo) por persona en todo el evento
    CONSTRAINT unique_voto_por_grupo 
        UNIQUE (correo_institucional, grupo_id)
);

-- 5. Habilitar Row Level Security (RLS)
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grupos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votos ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura pública
CREATE POLICY "Lectura pública de categorías" ON public.categorias FOR SELECT USING (true);
CREATE POLICY "Lectura pública de grupos" ON public.grupos FOR SELECT USING (true);
CREATE POLICY "Lectura pública de equipos" ON public.equipos FOR SELECT USING (true);
CREATE POLICY "Lectura pública de votos" ON public.votos FOR SELECT USING (true);

-- Políticas de inserción pública
CREATE POLICY "Permitir insercion de grupos" ON public.grupos FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir insercion de equipos" ON public.equipos FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir insercion de votos" ON public.votos FOR INSERT WITH CHECK (true);

-- 6. Habilitar Supabase Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.votos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.equipos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.grupos;

-- 7. Insertar las 3 Categorías Oficiales
INSERT INTO public.categorias (id, nombre, color, orden) VALUES
('botargas', 'Carrera de botargas', '#FE7B00', 1),
('stands', 'Decoración de stands', '#101010', 2),
('enbanderamiento', 'Embanderamiento', '#FE6E02', 3)
ON CONFLICT (id) DO UPDATE SET 
    nombre = EXCLUDED.nombre,
    color = EXCLUDED.color,
    orden = EXCLUDED.orden;
