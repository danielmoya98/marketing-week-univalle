import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Cargar variables de entorno de .env
const env = Object.fromEntries(
  fs.readFileSync('.env', 'utf8')
    .split('\n')
    .filter(l => l.includes('='))
    .map(l => l.trim().split('=').map((s, i) => i === 0 ? s.trim() : s.slice(0).trim()))
);

const supabase = createClient(env.PUBLIC_SUPABASE_URL, env.PUBLIC_SUPABASE_ANON_KEY);

const CATEGORIAS = ['botargas', 'stands', 'enbanderamiento'];

const TEAMS_SEED = [
  { nombre: 'Los Pixelados', lider: 'Daniel Moya', correo: 'est3005501@est.univalle.edu', miembros: 6, color: '#FF7A00' },
  { nombre: 'Brand Hunters', lider: 'Valeria Cruz', correo: 'est3005502@est.univalle.edu', miembros: 5, color: '#FE6E02' },
  { nombre: 'Los Insights', lider: 'Carlos Mendoza', correo: 'est3005503@est.univalle.edu', miembros: 7, color: '#FF8811' },
  { nombre: 'Grupo Pulso', lider: 'Andrea Salinas', correo: 'est3005504@est.univalle.edu', miembros: 4, color: '#E06000' },
  { nombre: 'Mix Creativo', lider: 'Fernando Rojas', correo: 'est3005505@est.univalle.edu', miembros: 6, color: '#FFA033' },
  { nombre: 'Estrategia Sur', lider: 'Camila Quispe', correo: 'est3005506@est.univalle.edu', miembros: 5, color: '#CC5200' },
  { nombre: 'Vortex Creativo', lider: 'Mateo Fernandez', correo: 'est3005507@est.univalle.edu', miembros: 8, color: '#FF7000' },
  { nombre: 'Target Master', lider: 'Luciana Torrico', correo: 'est3005508@est.univalle.edu', miembros: 5, color: '#D95B00' },
  { nombre: 'Neuromarkers', lider: 'Alejandro Paz', correo: 'est3005509@est.univalle.edu', miembros: 6, color: '#FF7A00' },
  { nombre: 'Sinergia Univalle', lider: 'Sofia Gutierrez', correo: 'est3005510@est.univalle.edu', miembros: 7, color: '#F56500' }
];

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runSimulation() {
  console.log('====================================================');
  console.log('🚀 INICIANDO SIMULACIÓN DE MARKETING WEEK 2026');
  console.log('====================================================\n');

  // 1. Limpieza y preparación inicial de votos previos (si hubiese)
  console.log('🧹 1. Verificando estado de Supabase...');
  const { data: existingGrupos } = await supabase.from('grupos').select('id, nombre');
  
  let createdGroups = [];
  let categoryEquiposMap = {}; // { grupoId: { botargas: equipoId, stands: equipoId, enbanderamiento: equipoId } }

  if (!existingGrupos || existingGrupos.length < 10) {
    console.log('📋 Registrando los 10 Equipos oficiales con validaciones Univalle...');

    for (let i = 0; i < TEAMS_SEED.length; i++) {
      const t = TEAMS_SEED[i];

      // Insertar en 'grupos'
      const { data: gData, error: gErr } = await supabase
        .from('grupos')
        .insert({
          nombre: t.nombre,
          lider: t.lider,
          correo_lider: t.correo,
          integrantes: t.miembros,
          categorias: CATEGORIAS,
          color: t.color
        })
        .select()
        .single();

      if (gErr) {
        // Si ya existe por nombre o correo, consultarlo
        const { data: found } = await supabase
          .from('grupos')
          .select('id, nombre, categorias')
          .eq('correo_lider', t.correo)
          .single();
        if (found) {
          createdGroups.push(found);
        } else {
          console.error(`Error creando grupo ${t.nombre}:`, gErr.message);
        }
      } else {
        createdGroups.push(gData);
      }
    }
  } else {
    console.log(`✅ Ya existen ${existingGrupos.length} grupos registrados en Supabase.`);
    createdGroups = existingGrupos;
  }

  console.log(`\n✅ ${createdGroups.length} Equipos listos en la base de datos.`);

  // 2. Asegurar que cada grupo tiene sus filas correspondientes en 'equipos'
  console.log('\n🔗 2. Verificando sub-equipos por categoría (botargas, stands, enbanderamiento)...');
  const { data: existingEquipos } = await supabase.from('equipos').select('id, grupo_id, categoria_id, nombre');
  
  const existingEquiposSet = new Set((existingEquipos || []).map(e => `${e.grupo_id}_${e.categoria_id}`));

  for (const g of createdGroups) {
    categoryEquiposMap[g.id] = {};
    for (const cat of CATEGORIAS) {
      const key = `${g.id}_${cat}`;
      const found = (existingEquipos || []).find(e => e.grupo_id === g.id && e.categoria_id === cat);
      if (found) {
        categoryEquiposMap[g.id][cat] = found.id;
      } else {
        const { data: newEq, error: eqErr } = await supabase
          .from('equipos')
          .insert({
            grupo_id: g.id,
            categoria_id: cat,
            nombre: g.nombre,
            color: '#FF7A00',
            orden: CATEGORIAS.indexOf(cat) + 1
          })
          .select()
          .single();

        if (newEq) {
          categoryEquiposMap[g.id][cat] = newEq.id;
        }
      }
    }
  }

  console.log('✅ Equipos categorizados correctamente.');

  // 3. Generación y Envío de 50 VOTOS SIMULADOS en Tiempo Real
  console.log('\n====================================================');
  console.log('📲 3. INICIANDO SECUENCIA DE 50 VOTOS ESCANEANDO QR EN VIVO');
  console.log('   (Observa la pantalla del marcador para ver la animación FLIP)');
  console.log('====================================================\n');

  // Matriz de control para evitar violaciones de unicidad:
  // - 1 voto por estudiante por categoría
  // - 1 voto por estudiante por equipo en todo el torneo
  const studentVotedCategories = new Map(); // studentEmail -> Set of categories
  const studentVotedGroups = new Map();     // studentEmail -> Set of groupIds

  let totalVotesDone = 0;
  const targetVotes = 50;

  // Creamos un pool de 60 estudiantes con correos Univalle válidos
  const studentPool = Array.from({ length: 60 }, (_, idx) => {
    const num = String(3010000 + idx + 1);
    return `est${num}@est.univalle.edu`;
  });

  // Pondremos mayor dinamismo asignando votos con distribución para generar cambios de posición
  for (let voteNum = 1; voteNum <= targetVotes; voteNum++) {
    // Escoger un estudiante que tenga disponibilidad
    const student = studentPool[voteNum % studentPool.length];
    if (!studentVotedCategories.has(student)) studentVotedCategories.set(student, new Set());
    if (!studentVotedGroups.has(student)) studentVotedGroups.set(student, new Set());

    const studentCats = studentVotedCategories.get(student);
    const studentGroups = studentVotedGroups.get(student);

    // Filtrar categorías en las que aún no votó
    const availableCats = CATEGORIAS.filter(c => !studentCats.has(c));
    // Filtrar equipos a los que aún no votó
    const availableGroups = createdGroups.filter(g => !studentGroups.has(g.id));

    if (availableCats.length === 0 || availableGroups.length === 0) {
      continue;
    }

    // Elegir aleatoriamente categoría y grupo disponible
    const chosenCat = availableCats[Math.floor(Math.random() * availableCats.length)];
    const chosenGroup = availableGroups[Math.floor(Math.random() * availableGroups.length)];
    const equipoId = categoryEquiposMap[chosenGroup.id]?.[chosenCat];

    if (!equipoId) continue;

    // Registrar en Supabase
    const { data: vInsert, error: vErr } = await supabase
      .from('votos')
      .insert({
        categoria_id: chosenCat,
        equipo_id: equipoId,
        grupo_id: chosenGroup.id,
        correo_institucional: student
      })
      .select()
      .single();

    if (vErr) {
      console.warn(`[Voto #${voteNum} Omitido/Duplicado]:`, vErr.message);
    } else {
      totalVotesDone++;
      studentCats.add(chosenCat);
      studentGroups.add(chosenGroup.id);

      const qrScanUrl = `http://10.196.74.33:4321/votar?equipo=${chosenGroup.id}`;
      console.log(`[⚡ VOTO #${String(totalVotesDone).padStart(2, '0')}/50] ${student} escaneó QR de "${chosenGroup.nombre}" ➔ Votó en "${chosenCat.toUpperCase()}"`);
    }

    // Pausa dinámica entre 350ms y 750ms para permitir ver las animaciones fluidamente
    const delay = Math.floor(Math.random() * 400) + 350;
    await sleep(delay);
  }

  console.log('\n====================================================');
  console.log(`🎉 SIMULACIÓN COMPLETADA CON ÉXITO: ${totalVotesDone} VOTOS REGISTRADOS`);
  console.log('   Todos los datos están guardados en Supabase (public.votos y public.grupos).');
  console.log('====================================================');
}

runSimulation().catch(err => {
  console.error('Error general en la simulación:', err);
  process.exit(1);
});
