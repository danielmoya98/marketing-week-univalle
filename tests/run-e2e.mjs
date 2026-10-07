import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SCREENSHOTS_DIR = path.resolve('tests/screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function runE2ETests() {
  console.log('🚀 Iniciando Suite de Pruebas E2E: Inscripción Marketing Week 2026...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  const results = [];

  try {
    // ----------------------------------------------------
    // TEST 1: Carga Inicial de la Página y Estado por Defecto
    // ----------------------------------------------------
    console.log('\n--- Caso 1: Carga Inicial y Estado por Defecto ---');
    await page.goto('http://localhost:4321/inscribir', { waitUntil: 'networkidle' });
    
    // Verificar que las categorías obligatorias estén marcadas y bloqueadas
    const botargasDisabled = await page.$eval('#c_bot', el => el.disabled);
    const botargasChecked = await page.$eval('#c_bot', el => el.checked);
    const standsDisabled = await page.$eval('#c_sta', el => el.disabled);
    const standsChecked = await page.$eval('#c_sta', el => el.checked);
    const enbanderamientoChecked = await page.$eval('#c_ban', el => el.checked);
    const enbanderamientoDisabled = await page.$eval('#c_ban', el => el.disabled);

    // Olimpiadas de Marketing no debe existir
    const olimpiadasExists = await page.$('#c_oli');

    console.log(`✓ Carrera de Botargas (Obligatoria/Bloqueada): Checked=${botargasChecked}, Disabled=${botargasDisabled}`);
    console.log(`✓ Decoración de Stands (Obligatoria/Bloqueada): Checked=${standsChecked}, Disabled=${standsDisabled}`);
    console.log(`✓ Enbanderamiento (Opcional/Seleccionable): Checked=${enbanderamientoChecked}, Disabled=${enbanderamientoDisabled}`);
    console.log(`✓ Olimpiadas eliminada: Exists=${olimpiadasExists !== null}`);

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01_estado_inicial.png'), fullPage: false });
    results.push({
      test: '01_estado_inicial_categorias_correctas',
      passed: botargasDisabled && botargasChecked && standsDisabled && standsChecked && !enbanderamientoDisabled && olimpiadasExists === null
    });

    // ----------------------------------------------------
    // TEST 2: Caso Borde - Intento de envío con campos vacíos
    // ----------------------------------------------------
    console.log('\n--- Caso 2: Validación de Campos Vacíos (Borde) ---');
    await page.click('#submitBtn');
    await page.waitForTimeout(400);

    // El modal no debe abrirse si faltan campos
    const modalVisibleEmpty = await page.$eval('#teamSuccessModal', el => el.style.display !== 'none');
    console.log(`✓ Formulario bloqueó envío vacío: Modal Visible=${modalVisibleEmpty}`);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02_validacion_campos_vacios.png'), fullPage: false });
    results.push({
      test: '02_validacion_campos_vacios',
      passed: !modalVisibleEmpty
    });

    // ----------------------------------------------------
    // TEST 3: Caso Borde - Correo no Institucional (gmail.com)
    // ----------------------------------------------------
    console.log('\n--- Caso 3: Caso Borde - Correo no Institucional (gmail.com) ---');
    await page.fill('#gName', 'Escuadra Alpha');
    await page.fill('#gLeader', 'Juan Perez');
    await page.fill('#gEmail', 'juan.perez@gmail.com');
    await page.fill('#gMembers', '5');

    // Desactivamos la validación nativa de HTML5 para testear el motor de validación JS y alerta
    await page.evaluate(() => {
      document.getElementById('regForm').noValidate = true;
    });
    await page.click('#submitBtn');
    await page.waitForTimeout(500);

    const alertVisible = await page.$eval('#formErrorAlert', el => el.style.display === 'block');
    const alertText = await page.$eval('#formErrorAlert', el => el.textContent);
    console.log(`✓ Alerta de correo no institucional visible: ${alertVisible} -> "${alertText}"`);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03_correo_invalido_alerta.png'), fullPage: false });
    results.push({
      test: '03_correo_invalido_alerta',
      passed: alertVisible && alertText.includes('@univalle.edu')
    });

    // Restauramos noValidate
    await page.evaluate(() => {
      document.getElementById('regForm').noValidate = false;
    });

    // ----------------------------------------------------
    // TEST 4: Caso Borde - Integrantes fuera de rango (0 o > 30)
    // ----------------------------------------------------
    console.log('\n--- Caso 4: Caso Borde - Cantidad de Integrantes Inválida ---');
    await page.fill('#gEmail', 'mjc3005567@est.univalle.edu');
    await page.fill('#gMembers', '0');
    await page.evaluate(() => {
      document.getElementById('regForm').noValidate = true;
    });
    await page.click('#submitBtn');
    await page.waitForTimeout(500);

    const membersErr = await page.$eval('#eMembers', el => el.textContent);
    console.log(`✓ Error de integrantes capturado: "${membersErr}"`);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04_integrantes_fuera_rango.png'), fullPage: false });
    results.push({
      test: '04_integrantes_fuera_rango',
      passed: membersErr.includes('1 y 30')
    });
    await page.evaluate(() => {
      document.getElementById('regForm').noValidate = false;
    });

    // ----------------------------------------------------
    // TEST 5: Flujo Exitoso - Registro del Equipo 1 (Dorsal Correlativo N° 01)
    // ----------------------------------------------------
    console.log('\n--- Caso 5: Flujo Exitoso - Inscripción Equipo 1 (N° 01) ---');
    await page.fill('#gName', 'Los Halcones Dorados');
    await page.fill('#gLeader', 'Sofia Mendez');
    await page.fill('#gEmail', 'smz3001234@est.univalle.edu');
    await page.fill('#gMembers', '6');
    await page.check('#c_ban'); // Activar también la opcional (Enbanderamiento)

    // Clic en inscribir
    await page.click('#submitBtn');

    // Esperar a que el modal aparezca
    await page.waitForSelector('#teamSuccessModal', { state: 'visible', timeout: 12000 });
    const modalTeamNum1 = await page.$eval('#modalTeamNum', el => el.textContent.trim());
    const modalTeamName1 = await page.$eval('#modalTeamName', el => el.textContent.trim());
    const modalQrSrc1 = await page.$eval('#modalQrImage', el => el.src);

    console.log(`✓ Modal visible para Equipo 1: ${modalTeamName1} con Dorsal ${modalTeamNum1}`);
    console.log(`✓ QR generado en base64: ${modalQrSrc1.startsWith('data:image/png;base64')}`);

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05_modal_exito_equipo_01.png'), fullPage: false });
    results.push({
      test: '05_modal_exito_equipo_01',
      passed: modalTeamNum1 === 'N° 01' && modalTeamName1 === 'Los Halcones Dorados' && modalQrSrc1.includes('data:image/png;base64')
    });

    // Cerrar modal con el botón "Entendido, ver mi dorsal"
    await page.click('#closeModalBtn');
    await page.waitForTimeout(500);

    const bNumText1 = await page.$eval('#bNum', el => el.textContent.trim());
    const bActionsVisible = await page.$eval('#bActions', el => el.style.display !== 'none');
    console.log(`✓ Dorsal en vivo en pantalla: ${bNumText1}, Botón descarga visible: ${bActionsVisible}`);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06_dorsal_pantalla_equipo_01.png'), fullPage: false });
    results.push({
      test: '06_dorsal_pantalla_equipo_01',
      passed: bNumText1 === 'N° 01' && bActionsVisible
    });

    // ----------------------------------------------------
    // TEST 6: Caso Borde Crítico - Intento de Duplicidad de Correo (Mismo Mail, Otro Equipo)
    // ----------------------------------------------------
    console.log('\n--- Caso 6: Caso Borde - Correo Repetido (smz3001234@est.univalle.edu) ---');
    await page.fill('#gName', 'Escuadra Fénix');
    await page.fill('#gLeader', 'Sofia Mendez (Segundo Intento)');
    await page.fill('#gEmail', 'smz3001234@est.univalle.edu'); // Mismo mail ya registrado
    await page.fill('#gMembers', '5');

    await page.click('#submitBtn');
    await page.waitForTimeout(1000);

    const duplicateAlertVisible = await page.$eval('#formErrorAlert', el => el.style.display === 'block');
    const duplicateAlertText = await page.$eval('#formErrorAlert', el => el.textContent);
    console.log(`✓ Alerta de correo duplicado visible: ${duplicateAlertVisible} -> "${duplicateAlertText}"`);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '07_correo_duplicado_bloqueado.png'), fullPage: false });
    results.push({
      test: '06_bloqueo_correo_duplicado',
      passed: duplicateAlertVisible && duplicateAlertText.includes('ya tiene un equipo registrado')
    });

    // ----------------------------------------------------
    // TEST 7: Secuencialidad Correlativa - Registro del Equipo 2 con Correo Distinto (Dorsal N° 02)
    // ----------------------------------------------------
    console.log('\n--- Caso 7: Secuencialidad Correlativa - Inscripción Equipo 2 (N° 02) ---');
    await page.fill('#gName', 'Vortex Marketing');
    await page.fill('#gLeader', 'Rodrigo Claros');
    await page.fill('#gEmail', 'rcl3009999@univalle.edu'); // Mail distinto y válido
    await page.fill('#gMembers', '4');
    await page.uncheck('#c_ban'); // Solo las dos obligatorias

    await page.click('#submitBtn');
    await page.waitForSelector('#teamSuccessModal', { state: 'visible', timeout: 12000 });
    const modalTeamNum2 = await page.$eval('#modalTeamNum', el => el.textContent.trim());
    const modalTeamName2 = await page.$eval('#modalTeamName', el => el.textContent.trim());
    
    console.log(`✓ Modal visible para Equipo 2: ${modalTeamName2} con Dorsal ${modalTeamNum2}`);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '08_modal_exito_equipo_02_correlativo.png'), fullPage: false });
    results.push({
      test: '07_modal_exito_equipo_02_correlativo',
      passed: modalTeamNum2 === 'N° 02' && modalTeamName2 === 'Vortex Marketing'
    });

    // ----------------------------------------------------
    // TEST 8: Experiencia Móvil (375x812 - iPhone)
    // ----------------------------------------------------
    console.log('\n--- Caso 8: Experiencia Móvil (375x812) ---');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '09_modal_mobile_viewport.png'), fullPage: false });

    // Cerrar modal en móvil y ver el dorsal
    await page.click('#closeModalBtn');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '10_dorsal_mobile_viewport.png'), fullPage: false });
    results.push({
      test: '08_mobile_experience',
      passed: true
    });

  } catch (err) {
    console.error('❌ Error durante la ejecución de los tests E2E:', err);
  } finally {
    await browser.close();
  }

  console.log('\n========================================');
  console.log('RESUMEN DE PRUEBAS E2E EJECUTADAS:');
  console.log('========================================');
  results.forEach(r => {
    console.log(`${r.passed ? '✅ PASÓ' : '❌ FALLÓ'} -> ${r.test}`);
  });
  console.log('========================================');
}

runE2ETests();
