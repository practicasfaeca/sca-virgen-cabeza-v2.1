/* ============================================================
   i18n.js — Cambio de idioma ES ⇄ EN
   ============================================================
   • Inyecta un botón "EN/ES" en el header de escritorio y otro
     equivalente dentro del panel móvil. Ambos comparten estado.
   • Mantiene un diccionario ES → EN con coincidencia exacta del
     texto recortado (no se traducen fragmentos dentro de strings
     más largos). Esto preserva siempre los nombres propios de
     producto y marca.
   • Persiste la elección en localStorage ('idioma') para que se
     mantenga entre páginas y recargas.
   • Observa cambios del DOM (sólo childList y attributes; nunca
     characterData) para re-traducir contenido dinámico generado
     por el carrito, el catálogo, el modal o el formulario.
   • Durante la propia traducción, el observador se desconecta para
     evitar bucles de retraducción sobre nuestras propias escrituras.
   • Cualquier subárbol marcado con [data-i18n-skip] queda fuera del
     recorrido. Lo usamos en tarjetas de producto, filas del
     carrito y modal, donde los textos son nombres propios o
     contenido ya formateado dinámicamente.
   ============================================================ */

(function () {
  'use strict';

  // ----------------------------------------------------------
  // Configuración
  // ----------------------------------------------------------
  const STORAGE_KEY = 'idioma';
  const ATTRS = ['aria-label', 'placeholder', 'title', 'alt'];
  const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME']);
  const SKIP_ATTR = 'data-i18n-skip';

  // Clases cuyo subárbol no debe traducirse nunca. Vacío por defecto:
  // la traducción de los nombres y metadatos de producto se gestiona
  // íntegramente desde el diccionario por coincidencia exacta, lo
  // que preserva marcas ("DCOOP", "AOVE", "Olixicar") y traduce las
  // partes descriptivas ("Caja", "Lata", "Estuche regalo"). Si en
  // algún momento se necesita blindar un subárbol concreto, basta
  // con añadirlo a esta lista o ponerle [data-i18n-skip] en el HTML.
  const SKIP_CLASSES = [];

  function elTieneClaseSkip(el) {
    if (!el || el.nodeType !== 1 || !el.classList) return false;
    for (let i = 0; i < SKIP_CLASSES.length; i++) {
      if (el.classList.contains(SKIP_CLASSES[i])) return true;
    }
    return false;
  }

  // ----------------------------------------------------------
  // DICCIONARIO ES → EN
  // Sólo coincidencia exacta del texto recortado. Cualquier
  // diferencia ya no es match y el texto se deja como está.
  // ----------------------------------------------------------
  const ES_TO_EN = {
    /* ─── Header / nav ─── */
    'Inicio': 'Home',
    'La cooperativa': 'The Cooperative',
    'Tienda': 'Shop',
    'Productos agrícolas': 'Agricultural Products',
    'Contacto': 'Contact',
    'Navegación principal': 'Main navigation',
    'Navegación móvil': 'Mobile navigation',
    'Información en directo': 'Live information',
    'SCA Virgen de la Cabeza — Inicio': 'SCA Virgen de la Cabeza — Home',
    'SCA · Montejícar': 'SCA · Montejícar',
    'Acceso socios': 'Members Access',
    'Entra en tu área privada': 'Sign in to your private area',
    'Nº de socio o email': 'Member number or email',
    'Contraseña': 'Password',
    'Iniciar sesión': 'Sign in',
    '¿Has olvidado tu contraseña?': 'Forgot your password?',
    'Socios': 'Members',
    'Bienvenido/a': 'Welcome',
    'Ver carrito': 'View cart',
    'Abrir menú': 'Open menu',
    'Volver arriba': 'Back to top',

    /* ─── Footer ─── */
    'Cooperativa olivarera fundada en 1963. Aceite de montaña de la DOP Montes de Granada.':
      'Olive-growing cooperative founded in 1963. Mountain olive oil from the PDO Montes de Granada.',
    'Navegación': 'Navigation',
    'Legal': 'Legal',
    'Aviso legal y privacidad': 'Legal notice and privacy',
    'DOP Montes de Granada': 'PDO Montes de Granada',

    /* ─── Ticker (varias páginas) ─── */
    'Año LXIII · Edición Otoño 2026': 'Year LXIII · Autumn 2026 Edition',
    'Aceite de montaña · +900 m altitud': 'Mountain olive oil · +900 m altitude',
    'Venta directa en origen · Montejícar, Granada': 'Direct sale at origin · Montejícar, Granada',
    'Único Frutado · Edición Limitada disponible': 'Único Frutado · Limited Edition available',
    'Recogida gratuita en cooperativa': 'Free pickup at the cooperative',
    'Catálogo Otoño 2026 · Edición LXIII': 'Autumn 2026 Catalogue · LXIII Edition',
    'Único Frutado · Producción limitada disponible': 'Único Frutado · Limited production available',
    'Envío en 24-48 h en península': '24-48 h shipping within mainland Spain',
    'Pago seguro · IVA incluido': 'Secure payment · VAT included',
    'Pago seguro': 'Secure payment',
    'Tu pedido · revisión': 'Your order · review',
    '958 393 394 · L-V': '958 393 394 · Mon-Fri',
    'Montejícar · Granada': 'Montejícar · Granada',
    'Visitas concertadas a la almazara': 'Scheduled visits to the mill',
    'Camino de la Almazara, s/n': 'Camino de la Almazara, s/n',
    'Productos agrícolas · Venta directa': 'Agricultural products · Direct sale',
    'Solo en tienda física': 'In-store only',
    'Vareo · Fitosanitarios · Nutrición · Accesorios · Repuestos':
      'Olive harvesting · Plant protection · Nutrition · Accessories · Spare parts',
    'Suministro a socios y agricultores de la zona': 'Supply to members and local farmers',
    'Información legal · LSSI-CE · RGPD · LOPDGDD':
      'Legal information · LSSI-CE · GDPR · LOPDGDD',
    'SCA Virgen de la Cabeza · Avenida de Guadahortuna, 9 · Montejícar':
      'SCA Virgen de la Cabeza · Avenida de Guadahortuna, 9 · Montejícar',
    'CIF F18005009': 'Tax ID F18005009',
    'SCA Virgen de la Cabeza': 'SCA Virgen de la Cabeza',

    /* ─── HOME (index.html) ─── */
    'SCA Virgen de la Cabeza · Aceite de montaña de Montejícar desde 1963 · v2.1':
      'SCA Virgen de la Cabeza · Mountain Olive Oil from Montejícar since 1963 · v2.1',
    'Presentación': 'Introduction',
    'Desde 1963, aceite de montaña de Montejícar':
      'Since 1963, mountain olive oil from Montejícar',
    'Aceite de oliva virgen extra de la DOP Montes de Granada':
      'Extra virgin olive oil from the PDO Montes de Granada',
    'Estamos en plena recolección': 'We are in the middle of the harvest',
    'Envasando la última cosecha': 'Bottling the latest harvest',
    'Los olivos están en flor': 'The olive trees are in bloom',
    'Ver nuestros aceites': 'See our oils',
    'Más de medio siglo de cooperativismo en los Montes de Granada':
      'More than half a century of cooperativism in the Montes de Granada',
    'Somos una cooperativa fundada en 1963 por las familias olivareras de Montejícar. Desde entonces transformamos en nuestra almazara la cosecha de nuestros socios y elaboramos aceites que expresan el carácter del olivar de montaña.':
      "We are a cooperative founded in 1963 by the olive-growing families of Montejícar. Since then, we have processed our members' harvest in our mill and produced oils that express the character of the mountain olive grove.",
    'Pertenecemos a la DOP Montes de Granada y formamos parte de DCOOP, la mayor cooperativa olivarera de España. Eso nos da raíces locales y red para llegar lejos.':
      'We belong to the PDO Montes de Granada and we are part of DCOOP, the largest olive-growing cooperative in Spain. That gives us local roots and a network to reach far.',
    'Conoce nuestra historia': 'Discover our history',
    '¿Qué aceite buscas?': 'Which oil are you looking for?',
    'Encuentra el tuyo según el uso': 'Find yours based on use',
    'Para el uso diario': 'For daily use',
    'Aceites equilibrados y versátiles para guisos, sofritos y aliños cotidianos.':
      'Balanced and versatile oils for stews, sautés, and everyday dressings.',
    'Para disfrutar en crudo': 'To enjoy raw',
    'Monovarietales con carácter para ensaladas, tostadas, carpaccios y gazpachos.':
      'Single-variety oils with character for salads, toasts, carpaccios, and gazpachos.',
    'Edición limitada': 'Limited edition',
    'Hojiblanca de recolección temprana. Producción limitada de campaña.':
      'Early-harvest Hojiblanca. Limited campaign production.',
    'Ver tienda': 'See shop',
    'Nuestra historia': 'Our history',
    'Seis décadas de evolución': 'Six decades of evolution',
    'Fundación': 'Foundation',
    'Nace la cooperativa en Montejícar.': 'The cooperative is born in Montejícar.',
    'Integración en DCOOP': 'Integration into DCOOP',
    'Entramos en la mayor cooperativa olivarera de España.':
      'We join the largest olive-growing cooperative in Spain.',
    'Traslado de la almazara': 'Relocation of the mill',
    'Aprobación municipal del nuevo emplazamiento.': 'Municipal approval of the new site.',
    'Modernización': 'Modernization',
    'Subvención de 1,18 M € para mejorar las instalaciones.':
      'Grant of €1.18 M to improve the facilities.',
    'Apoyo energético': 'Energy support',
    'Ayuda REACT-UE por el sobrecoste de energía.': 'REACT-EU aid for the energy cost overrun.',
    'Autoconsumo solar': 'Solar self-consumption',
    'Instalación de placas fotovoltaicas en la almazara.':
      'Installation of photovoltaic panels at the mill.',
    'Por qué elegirnos': 'Why choose us',
    'Lo que hace único a nuestro aceite': 'What makes our oil unique',
    'Aceite de montaña': 'Mountain olive oil',
    'Nuestro olivar crece a más de 900 metros. La maduración lenta da aceites con cuerpo, alto en ácido oleico y baja acidez.':
      'Our olive grove grows at more than 900 meters. Slow ripening produces oils with body, high in oleic acid and low in acidity.',
    'Cooperativa familiar': 'Family cooperative',
    'Cientos de familias olivareras llevan décadas trayendo aquí su cosecha. Cada gota tiene un nombre detrás.':
      'Hundreds of olive-growing families have been bringing their harvest here for decades. Every drop has a name behind it.',
    'Compromiso con el medio ambiente': 'Commitment to the environment',
    'Hemos modernizado la almazara con ayudas públicas y autoconsumo fotovoltaico para reducir nuestra huella energética.':
      'We have modernized the mill with public grants and photovoltaic self-consumption to reduce our energy footprint.',
    'Único Frutado': 'Único Frutado',
    'Nuestro AOVE más exclusivo': 'Our most exclusive EVOO',
    'Un aceite reservado para los paladares más exigentes, con una producción muy reducida —muy por debajo de la del resto de nuestros aceites— elaborado a partir de una cuidada selección de los mejores lotes de campaña.':
      'An oil reserved for the most demanding palates, with a very small production — well below that of the rest of our oils — made from a careful selection of the best lots of the campaign.',
    'Una edición exclusiva y limitada. Cuando se agotan las botellas, ya no hay más hasta la siguiente cosecha.':
      'An exclusive and limited edition. Once the bottles are sold out, there are no more until the next harvest.',
    'Comprar Único Frutado': 'Buy Único Frutado',
    '· EDICIÓN LIMITADA · COUPAGE FRUTADO ÚNICO · OTOÑO 26':
      '· LIMITED EDITION · UNIQUE FRUITY COUPAGE · AUTUMN 26',
    'Botella de aceite Único Frutado — hojiblanca de recolección temprana':
      'Bottle of Único Frutado olive oil — early-harvest Hojiblanca',
    'Exterior de la almazara de la cooperativa Virgen de la Cabeza en Montejícar':
      'Exterior of the Virgen de la Cabeza cooperative mill in Montejícar',

    /* ─── LA COOPERATIVA ─── */
    'La cooperativa · SCA Virgen de la Cabeza · v2.1':
      'The Cooperative · SCA Virgen de la Cabeza · v2.1',
    'Una cooperativa hecha de campo, personas y tiempo':
      'A cooperative made of countryside, people, and time',
    'Desde 1963 en Montejícar, Granada': 'Since 1963 in Montejícar, Granada',
    'Seis décadas de cooperativismo': 'Six decades of cooperativism',
    'Nace la cooperativa': 'The cooperative is born',
    'Un grupo de familias olivareras de Montejícar decide unirse para transformar juntos su cosecha. Así nace nuestra cooperativa: una almazara cooperativa nacida del trabajo de sus socios, no de un proyecto empresarial externo.':
      'A group of olive-growing families from Montejícar decide to come together to process their harvest jointly. That is how our cooperative was born: a cooperative mill born from the work of its members, not from an external business project.',
    'Nos sumamos a DCOOP': 'We join DCOOP',
    'Décadas después, la cooperativa se integra en DCOOP, la mayor cooperativa olivarera de España. Mantenemos nuestras raíces en Montejícar y ganamos una red de comercialización, técnica y conocimiento compartido.':
      'Decades later, the cooperative joins DCOOP, the largest olive-growing cooperative in Spain. We keep our roots in Montejícar and gain a commercial network, technical support, and shared knowledge.',
    'Una nueva almazara': 'A new mill',
    'El pleno municipal aprueba en 2016 el traslado de la almazara fuera del núcleo urbano. Cuatro años después llega la subvención que lo hace realidad: 1,18 millones de euros para mejorar y optimizar la elaboración. Producir mejor, con mejores instalaciones.':
      'In 2016, the municipal council approves the relocation of the mill outside the urban center. Four years later, the grant that makes it possible arrives: 1.18 million euros to improve and optimize production. Producing better, with better facilities.',
    'Energía del sol para nuestro aceite': 'Sun energy for our oil',
    'Instalamos placas fotovoltaicas para autoconsumo en la almazara. Un paso más en la línea que ya veníamos siguiendo con las ayudas REACT-UE de 2022 y FEADER para la eficiencia energética del patio de limpieza.':
      'We installed photovoltaic panels for self-consumption at the mill. One more step along the path we were already following with the REACT-EU aid in 2022 and FEADER funds for the energy efficiency of the cleaning yard.',
    'Nuestro territorio': 'Our territory',
    'Aceite que solo se hace en la montaña': 'Oil that is only made in the mountains',
    'Nuestros olivares crecen a más de 900 metros de altitud, en los Montes de Granada. Es uno de los enclaves olivareros más altos de la península ibérica.':
      'Our olive groves grow at more than 900 meters of altitude, in the Montes de Granada. It is one of the highest olive-growing locations on the Iberian Peninsula.',
    'La altitud y el frío del invierno hacen que la aceituna madure despacio. Es una maduración lenta, paciente, que concentra los aromas y deja un aceite con cuerpo y personalidad.':
      'The altitude and the cold winters cause the olive to ripen slowly. It is a slow, patient ripening that concentrates the aromas and produces an oil with body and personality.',
    'El resultado, año tras año:': 'The result, year after year:',
    'de altitud media': 'average altitude',
    'de ácido oleico': 'oleic acid',
    'de acidez típica': 'typical acidity',
    'Montes de Granada': 'Montes de Granada',
    'Compromiso': 'Commitment',
    'Modernizamos nuestra almazara con la mirada en el futuro':
      'We modernize our mill with an eye on the future',
    'La modernización de la almazara no fue solo de máquinas. Fue también de cómo producimos. Hoy una parte significativa de la energía que consumimos viene de nuestras propias placas solares, instaladas en el tejado de la almazara.':
      'Modernizing the mill was not just about machinery. It was also about how we produce. Today, a significant part of the energy we consume comes from our own solar panels, installed on the roof of the mill.',
    'Producir aceite de calidad sin desentenderse del entorno donde se cultiva la materia prima es algo que va con nuestra forma de entender la cooperativa.':
      'Producing quality oil without losing sight of the environment where the raw material is grown is something that fits with our way of understanding the cooperative.',
    'Subvención de modernización (1.186.092,95\u00A0€).':
      'Modernization grant (€1,186,092.95).',
    'Ayuda REACT-UE por sobrecoste energético.': 'REACT-EU aid for energy cost overrun.',
    'Eficiencia energética y autoconsumo solar.':
      'Energy efficiency and solar self-consumption.',
    'Garantía de origen': 'Origin guarantee',
    'Aceite certificado de los Montes de Granada':
      'Certified oil from the Montes de Granada',
    'Somos miembros de la Denominación de Origen Protegida Montes de Granada. Eso significa que cada botella\n              que sale de aquí está controlada en cada paso: desde la parcela hasta la envasadora.':
      'We are members of the Protected Designation of Origin Montes de Granada. That means every bottle that leaves here is monitored at every step: from the plot to the bottling line.',
    'La contraetiqueta numerada que llevan nuestros aceites certificados no es decoración. Es la prueba de que\n              ese lote concreto ha pasado los controles del consejo regulador.':
      "The numbered back label that our certified oils carry is not decoration. It is the proof that this specific batch has passed the regulatory council's controls.",
    'Prueba el aceite de nuestra cooperativa': 'Try the oil from our cooperative',
    'Venta directa desde la almazara, en cualquier formato.':
      'Direct sale from the mill, in any format.',
    'Ver aceites': 'See oils',
    'Visita la cooperativa': 'Visit the cooperative',

    /* ─── TIENDA ─── */
    'Tienda · SCA Virgen de la Cabeza · v2.1': 'Shop · SCA Virgen de la Cabeza · v2.1',
    'Venta directa en origen': 'Direct sale at origin',
    'Compra aceite directamente en origen': 'Buy oil directly at origin',
    'Recibe en casa el aceite de oliva virgen extra de nuestra cooperativa.\n          Venta directa desde Montejícar, en el corazón de los Montes de Granada.':
      'Receive at home the extra virgin olive oil from our cooperative. Direct sale from Montejícar, in the heart of the Montes de Granada.',
    'Nuestras referencias más cuidadas, en formatos y presentaciones especiales.\n              Producción limitada de campaña, también perfectas para regalar.':
      'Our most carefully crafted references, in special formats and presentations. Limited campaign production, also perfect as a gift.',
    'Monovarietales con carácter, para realzar platos en crudo.\n              Tostadas, ensaladas, carpaccios, gazpachos.':
      'Single-variety oils with character, to enhance raw dishes. Toasts, salads, carpaccios, gazpachos.',
    'Uso diario': 'Daily use',
    'Aceites equilibrados y versátiles, pensados para la cocina diaria.\n              Ideales para guisos, fritos y aliños cotidianos.':
      'Balanced and versatile oils, designed for daily cooking. Ideal for stews, frying, and everyday dressings.',
    'Añadir al carrito': 'Add to cart',

    /* Nombres y metadatos de tarjetas de producto.
       Las marcas (DCOOP, AOVE, Olixicar) se preservan; sólo se traducen
       las partes descriptivas (Estuche, Caja, Lata, Botella…). Los
       nombres puros (Único Frutado, DCOOP Selección Picual, Olixicar
       Picual…) se devuelven idénticos para que tampoco caigan en
       applyExtras. */
    'Único Frutado · Estuche regalo': 'Único Frutado · Gift box',
    'Único Coupage Frutado · Caja': 'Único Coupage Frutado · Case',
    'DCOOP Selección Picual': 'DCOOP Selección Picual',
    'Olixicar Picual': 'Olixicar Picual',
    'DCOOP Selección Arbequina': 'DCOOP Selección Arbequina',
    'DCOOP Selección Hojiblanca': 'DCOOP Selección Hojiblanca',
    'DCOOP Especial · Lata': 'DCOOP Especial · Tin',
    'DCOOP Especial Cooperativas': 'DCOOP Especial Cooperativas',
    'DCOOP Monovarietal Selección · Caja': 'DCOOP Monovarietal Selección · Case',
    'AOVE Coupage': 'EVOO Coupage',
    'Olixicar · Caja': 'Olixicar · Case',
    'Selección': 'Selection',
    'Hojiblanca temprana · 500 ml': 'Early-harvest Hojiblanca · 500 ml',
    'Hojiblanca temprana · estuche 500 ml': 'Early-harvest Hojiblanca · 500 ml gift box',
    'Coupage frutado · caja 6 × 500 ml': 'Fruity coupage · case of 6 × 500 ml',
    'Picual · 500 ml': 'Picual · 500 ml',
    'Arbequina · 250 ml': 'Arbequina · 250 ml',
    'Hojiblanca · 250 ml': 'Hojiblanca · 250 ml',
    'Coupage · lata 3 L': 'Coupage · 3 L tin',
    'Coupage · botella': 'Coupage · bottle',
    'Picual · Hojiblanca · Arbequina · caja 3 × 500 ml':
      'Picual · Hojiblanca · Arbequina · case of 3 × 500 ml',
    'Coupage · 1 L': 'Coupage · 1 L',
    'Coupage · 5 L': 'Coupage · 5 L',
    'Picual · 5 L': 'Picual · 5 L',
    'Coupage · caja 5 L': 'Coupage · 5 L case',

    /* Etiquetas del modal (perfil sensorial) */
    'Perfil sensorial': 'Sensory profile',
    'Frutado': 'Fruity',
    'Amargor': 'Bitterness',
    'Picor': 'Pungency',
    'Suave': 'Mild',
    'Medio': 'Medium',
    'Intenso': 'Intense',
    'Cantidad': 'Quantity',
    'Quitar uno': 'Remove one',
    'Añadir uno': 'Add one',
    'Cerrar': 'Close',
    'Producto añadido': 'Product added',
    'Ver carrito →': 'See cart →',

    /* ─── PRODUCTOS AGRÍCOLAS ─── */
    'Productos agrícolas · SCA Virgen de la Cabeza · v2.1':
      'Agricultural Products · SCA Virgen de la Cabeza · v2.1',
    'Todo lo que necesita el olivar': 'Everything the olive grove needs',
    'Suministramos a nuestros socios y al agricultor de la zona. Disponibles para compra directa en la cooperativa.':
      'We supply our members and local farmers. Available for direct purchase at the cooperative.',
    'Aviso de compra': 'Purchase notice',
    'Estos productos solo se venden en nuestras instalaciones.':
      'These products are only sold at our premises.',
    'Para consultar disponibilidad o precios, llámanos o pásate por la cooperativa.':
      'To check availability or prices, call us or stop by the cooperative.',
    'Ver cómo llegar': 'See how to get here',
    'Filtrar por categoría': 'Filter by category',
    'Todas': 'All',
    'Vareo': 'Olive harvesting',
    'Fitosanitarios': 'Plant protection',
    'Nutrición agrícola': 'Agricultural nutrition',
    'Accesorios': 'Accessories',
    'Repuestos': 'Spare parts',
    'Todo lo necesario para la recogida tradicional de la aceituna.':
      'Everything needed for the traditional olive harvest.',
    'Manta de vareo': 'Harvest blanket',
    'Mantas de gran formato para extender bajo el olivo y recoger la aceituna.':
      'Large-format blankets to spread under the olive tree and collect the olives.',
    'Disponible en la cooperativa': 'Available at the cooperative',
    'Rastrillo de vareo': 'Harvest rake',
    'Rastrillo manual para terminar de bajar la aceituna y agruparla.':
      'Manual rake to finish bringing down the olives and gather them.',
    'Vara': 'Harvest pole',
    'Varas de distintas medidas para el vareo tradicional.':
      'Poles of various sizes for traditional olive beating.',
    'Productos para el tratamiento de plagas y enfermedades del olivar.':
      'Products for the treatment of pests and diseases in the olive grove.',
    'Fungicidas': 'Fungicides',
    'Tratamientos contra hongos y enfermedades fúngicas.':
      'Treatments against fungi and fungal diseases.',
    'Herbicidas': 'Herbicides',
    'Control de hierbas competidoras del olivar.':
      'Control of weeds competing with the olive grove.',
    'Insecticidas': 'Insecticides',
    'Para plagas comunes como mosca del olivo, polilla y prays.':
      'For common pests such as olive fly, moth, and prays.',
    'Abonos y fertilizantes para mantener el vigor del olivar.':
      'Fertilizers to maintain the vigor of the olive grove.',
    'Abonos': 'Manures',
    'Abonos orgánicos y minerales para fertilización de fondo.':
      'Organic and mineral manures for base fertilization.',
    'Fertilizantes': 'Fertilizers',
    'Fertilizantes específicos para olivar adulto y plantaciones jóvenes.':
      'Specific fertilizers for adult olive groves and young plantations.',
    'Accesorios agrícolas': 'Agricultural accessories',
    'Material complementario para el trabajo en el campo.':
      'Complementary material for fieldwork.',
    'Capazos': 'Baskets',
    'Capazos de distintos tamaños para recolección manual.':
      'Baskets of various sizes for manual harvesting.',
    'Guantes de trabajo': 'Work gloves',
    'Guantes resistentes para faenas del campo.':
      'Hard-wearing gloves for fieldwork.',
    'Repuestos de maquinaria': 'Machinery spare parts',
    'Piezas y componentes para mantenimiento de maquinaria agrícola común en el olivar.':
      'Parts and components for the maintenance of agricultural machinery commonly used in the olive grove.',
    'Repuestos varios': 'Miscellaneous spare parts',
    'Pasa por la cooperativa para consultar disponibilidad de piezas específicas.':
      'Stop by the cooperative to check availability of specific parts.',
    '¿Te interesa algún producto?': 'Interested in any product?',
    'Pásate por la cooperativa o llámanos. Atendemos en horario de almazara y campaña.':
      'Stop by the cooperative or call us. We attend during mill hours and harvest campaign.',
    'Dirección': 'Address',
    'Cooperativa Virgen de la Cabeza': 'Cooperativa Virgen de la Cabeza',
    'Teléfono': 'Phone',
    'Correo': 'Email',
    'Horario': 'Opening hours',
    'Consulta por teléfono': 'Call us to check',
    'Ver mapa y contacto': 'See map and contact',

    /* ─── CONTACTO ─── */
    'Contacto · SCA Virgen de la Cabeza · v2.1': 'Contact · SCA Virgen de la Cabeza · v2.1',
    'Estamos cerca de ti': "We're close to you",
    'Por teléfono, por correo, o de visita en la almazara.':
      'By phone, by email, or by visiting the mill.',
    'Mapa y formulario de contacto': 'Map and contact form',
    'Escríbenos': 'Write to us',
    'Nombre': 'Name',
    '(opcional)': '(optional)',
    'Asunto': 'Subject',
    'Selecciona un asunto…': 'Select a subject…',
    'Información general': 'General information',
    'Pedido': 'Order',
    'Visitar la cooperativa': 'Visit the cooperative',
    'Otro': 'Other',
    'Mensaje': 'Message',
    'Enviar mensaje': 'Send message',
    'Enviando…': 'Sending…',
    'Te responderemos en un plazo de 24-48 horas laborables.':
      'We will reply within 24-48 business hours.',
    'Mensaje enviado. Te responderemos pronto.':
      'Message sent. We will reply shortly.',
    'O contáctanos directamente': 'Or contact us directly',
    'Aquí tienes todos nuestros datos': 'Here are all our details',
    'Ver en Google Maps': 'See on Google Maps',
    'Llamar ahora': 'Call now',
    'Correo electrónico': 'Email',
    'Escribir un email': 'Write an email',
    'Horario de atención': 'Opening hours',
    'Lunes a viernes': 'Monday to Friday',
    'Llámanos para confirmar el horario del día.':
      'Call us to confirm the day’s opening hours.',
    'En campaña de aceituna ampliamos horario. Llámanos antes de venir.':
      'During the olive harvest season we extend our opening hours. Please call before visiting.',
    'Pásate a vernos': 'Stop by and see us',
    'Estamos abiertos a quien quiera conocer cómo se hace nuestro aceite. Ven a recoger un pedido, prueba el aceite directamente del lagar o consulta cualquier duda sobre el olivar.':
      'We are open to anyone who wants to learn how our oil is made. Come to pick up an order, taste the oil straight from the press, or ask any questions about the olive grove.',
    'Si vienes en grupo, llámanos antes y te organizamos una visita.':
      'If you are coming as a group, call us beforehand and we will organize a visit for you.',
    'Llámanos para visitar': 'Call us to visit',
    'Datos corporativos': 'Corporate data',
    'Sociedad Cooperativa Andaluza Virgen de la Cabeza':
      'Sociedad Cooperativa Andaluza Virgen de la Cabeza',
    'Razón social': 'Legal name',
    'Domicilio social': 'Registered office',
    'Registro': 'Registration',
    'Camino de la Almazara, s/n · 18561 Montejícar, Granada':
      'Camino de la Almazara, s/n · 18561 Montejícar, Granada',
    'Registro de Cooperativas Andaluzas': 'Registry of Andalusian Cooperatives',
    'Aviso legal completo': 'Full legal notice',
    'Política de privacidad': 'Privacy policy',
    'Política de cookies': 'Cookie policy',
    'Ubicación de la cooperativa Virgen de la Cabeza en Montejícar, Granada':
      'Location of the Virgen de la Cabeza cooperative in Montejícar, Granada',

    /* ─── CARRITO ─── */
    'Tu carrito · SCA Virgen de la Cabeza · v2.1':
      'Your Cart · SCA Virgen de la Cabeza · v2.1',
    'Carrito': 'Cart',
    'Tu carrito': 'Your cart',
    'Revisa tu pedido antes de confirmarlo.': 'Review your order before confirming it.',
    'Aún no has añadido productos.': "You haven't added any products yet.",
    'Productos en el carrito': 'Products in the cart',
    'Resumen del pedido': 'Order summary',
    'Resumen': 'Summary',
    'Subtotal': 'Subtotal',
    'Envío': 'Shipping',
    'Total': 'Total',
    'El precio incluye IVA.': 'The price includes VAT.',
    'Finalizar pedido': 'Complete order',
    '← Seguir comprando': '← Continue shopping',
    'Carrito vacío': 'Empty cart',
    'Tu carrito está vacío': 'Your cart is empty',
    'Cuando añadas aceites desde la tienda, aparecerán aquí.':
      'When you add oils from the shop, they will appear here.',
    'Ir a la tienda': 'Go to shop',
    'Pedido confirmado': 'Order confirmed',
    '¡Pedido recibido!': 'Order received!',
    'Hemos guardado tu pedido. Te contactaremos por teléfono o correo en menos de 24 horas para confirmar la disponibilidad, el método de pago y la entrega.':
      'We have saved your order. We will contact you by phone or email within 24 hours to confirm availability, payment method, and delivery.',
    'Número de pedido': 'Order number',
    'Productos': 'Products',
    '¿Quieres contactarnos antes?': 'Want to contact us first?',
    '¿Prefieres correo?': 'Prefer email?',
    'Volver a la tienda': 'Back to shop',
    'Disminuir cantidad': 'Decrease quantity',
    'Aumentar cantidad': 'Increase quantity',

    /* ─── AVISO LEGAL ─── */
    'Aviso legal y privacidad · SCA Virgen de la Cabeza · v2.1':
      'Legal Notice and Privacy Policy · SCA Virgen de la Cabeza · v2.1',
    'Información legal': 'Legal information',
    'Aviso legal y Política de privacidad':
      'Legal Notice and Privacy Policy',
    'Última actualización: [pendiente en la publicación]':
      'Last updated: [pending at publication]',
    'Índice': 'Index',
    'Información del responsable': 'Data controller',
    'Recogida y tratamiento de datos': 'Collection and processing of data',
    'Finalidad del tratamiento': 'Purpose of processing',
    'Legitimación': 'Legal basis',
    'Destinatarios': 'Recipients',
    'Derechos del usuario': 'User rights',
    'Responsabilidades': 'Liabilities',
    'Navegación, acceso y seguridad': 'Browsing, access, and security',
    'Propiedad intelectual e industrial': 'Intellectual and industrial property',
    'Condiciones adicionales': 'Additional terms',
    'Aspectos técnicos': 'Technical aspects',
    'Actualización y modificación': 'Update and modification',
    'Ley aplicable y jurisdicción': 'Applicable law and jurisdiction',
    '¿Tienes alguna duda sobre tus datos?': 'Any questions about your data?',

    /* ─── TIENDA: modal de producto — meta (variedad · formato) ─── */
    'Hojiblanca temprana · Estuche · 500 ml': 'Early-harvest Hojiblanca · Gift box · 500 ml',
    'Coupage frutado · Caja · 6 botellas 500 ml': 'Fruity coupage · Case · 6 bottles 500 ml',
    'Coupage · Lata 3 L': 'Coupage · 3 L tin',
    'Coupage · Botella 750 ml': 'Coupage · 750 ml bottle',
    'Coupage · Botella 1 L': 'Coupage · 1 L bottle',
    'Coupage · Garrafa 5 L': 'Coupage · 5 L jerrycan',
    'Coupage · Caja 5 L': 'Coupage · 5 L case',
    'Monovarietal · Caja · 3 estuches 500 ml':
      'Single-variety · Case · 3 gift boxes 500 ml',

    /* ─── TIENDA: modal — descripciones de producto ─── */
    'Hojiblanca de recolección temprana, seleccionada de los mejores lotes del inicio de campaña. Cuerpo, vigor y un frutado intenso que solo aparece en las primeras semanas de molienda. Edición limitada.':
      'Early-harvest Hojiblanca, selected from the best lots at the start of the campaign. Body, vigour, and an intense fruity character that only appears in the first weeks of milling. Limited edition.',
    'La misma hojiblanca temprana de nuestro Único Frutado, presentada en estuche de regalo. Acabado cuidado para una ocasión especial: cumpleaños, agradecimientos, fechas señaladas.':
      'The same early-harvest Hojiblanca as our Único Frutado, presented in a gift box. A careful finish for a special occasion: birthdays, thank-yous, important dates.',
    'Caja de seis botellas del Único Coupage Frutado. Coupage de aceitunas tempranas seleccionadas, con un frutado intenso y un equilibrio cuidado. Pensado para hostelería, regalos corporativos o para tener provisión en casa de un AOVE excepcional.':
      'A case of six bottles of the Único Coupage Frutado. A coupage of selected early olives, with an intense fruity character and a carefully balanced profile. Designed for hospitality, corporate gifts, or keeping a supply of an exceptional EVOO at home.',
    'Selección de la mejor picual del grupo cooperativo DCOOP. Frutado verde marcado, amargor y picor altos perfectamente integrados. Un aceite para los que disfrutan del carácter.':
      'A selection of the finest Picual from the DCOOP cooperative group. Marked green fruity notes, with high bitterness and pungency perfectly integrated. An oil for those who enjoy character.',
    'Versión 500 ml del Olixicar, picual monovarietal vigoroso. Botella manejable para tener cerca de la encimera y darle uso a diario en crudo.':
      '500 ml version of Olixicar, a vigorous single-variety Picual. A handy bottle to keep near the worktop and use raw on a daily basis.',
    'Arbequina monovarietal, suave y muy aromática. La opción más amable de la gama: poco amarga, con un final dulce y notas a plátano y almendra fresca.':
      'Single-variety Arbequina, mild and very aromatic. The friendliest choice in our range: low bitterness, with a sweet finish and notes of banana and fresh almond.',
    'Hojiblanca monovarietal: más suave que la picual, con notas finas a manzana verde y almendra. Un aceite elegante para platos cuidados.':
      'Single-variety Hojiblanca: softer than the Picual, with fine notes of green apple and almond. An elegant oil for refined dishes.',
    'Coupage DCOOP Especial Cooperativas en lata de 3 litros. Formato práctico para cocinas profesionales o consumo intensivo: la lata protege el aceite mejor que el plástico.':
      'DCOOP Especial Cooperativas coupage in a 3-litre tin. A practical format for professional kitchens or heavy use: the tin protects the oil better than plastic.',
    'Línea Especial Cooperativas de DCOOP en botella. Un virgen extra estable y de calidad consistente, presentado para uso en mesa.':
      'DCOOP Especial Cooperativas line in a bottle. A stable extra virgin with consistent quality, ready for the table.',
    'Una caja con los tres monovarietales de la línea Selección: picual, hojiblanca y arbequina. Pensada para comparar variedades en una misma comida o para regalar a quien quiere descubrir matices.':
      'A case with the three single-variety oils from the Selección line: Picual, Hojiblanca, and Arbequina. Designed to compare varieties in the same meal, or as a gift for someone who wants to discover nuances.',
    'Nuestro coupage cooperativa, hecho con las variedades del olivar de Montejícar. Un AOVE equilibrado, sin aristas, pensado para acompañar la cocina diaria sin imponerse.':
      'Our cooperative coupage, made from the varieties of the Montejícar olive grove. A balanced, unpretentious EVOO designed to accompany daily cooking without taking over.',
    'Formato familiar de nuestro coupage. Misma calidad equilibrada que el de 1 l en una garrafa pensada para el consumo intensivo en casa o en hostelería.':
      'Family-size version of our coupage. The same balanced quality as the 1 L bottle, in a jerrycan designed for heavy use at home or in hospitality.',
    'Picual monovarietal en formato familiar. Carácter robusto del olivar andaluz para quien busca un aceite con personalidad para el día a día.':
      'Single-variety Picual in family-size format. The robust character of the Andalusian olive grove for anyone looking for an everyday oil with personality.',
    'Línea Especial Cooperativas de DCOOP en formato 1 L. Un virgen extra estable y de calidad consistente, pensado para la cocina del día a día.':
      'DCOOP Especial Cooperativas line in a 1 L format. A stable extra virgin with consistent quality, designed for everyday cooking.',
    'Formato familiar de la línea Especial Cooperativas DCOOP. Garrafa de 5 L para el consumo intensivo en casa o cocinas profesionales, sin renunciar a la calidad consistente del coupage cooperativa.':
      'Family-size version of the DCOOP Especial Cooperativas line. A 5 L jerrycan for heavy use at home or in professional kitchens, without giving up the consistent quality of the cooperative coupage.',
    'Olixicar en caja de 5 L, pensado para hostelería y consumo intensivo. Formato estable y manejable que protege el aceite mejor que el plástico.':
      'Olixicar in a 5 L bag-in-box, designed for hospitality and heavy use. A stable, manageable format that protects the oil better than plastic.',

    /* ─── TIENDA: modal — recomendaciones de uso ─── */
    'Perfecto en crudo: pan tostado, jamón, solomillo a la plancha.':
      'Perfect raw: on toast, with cured ham, on grilled sirloin.',
    'El regalo seguro para alguien al que le importa lo que come.':
      'A safe-bet gift for someone who cares about what they eat.',
    'Provisión anual para una mesa exigente. También una opción elegante de regalo de empresa.':
      'A year-round supply for a demanding table. Also an elegant corporate gift.',
    'Perfecto para tostadas, ensaladas de tomate, gazpachos y carpaccios.':
      'Perfect for toast, tomato salads, gazpachos, and carpaccios.',
    'Perfecto para tostadas, ensaladas y para terminar un buen guiso fuera del fuego.':
      'Perfect for toast, salads, and to finish a good stew off the heat.',
    'Repostería, ensaladas suaves, pescados blancos al horno. Buena puerta de entrada al mundo del AOVE.':
      'Baking, mild salads, baked white fish. A good gateway into the world of EVOO.',
    'Pescados blancos al horno, carpaccios de verduras o un buen tomate de temporada en aceite.':
      'Baked white fish, vegetable carpaccios, or a good seasonal tomato dressed in oil.',
    'Restauración y hostelería: aliños, terminados al plato, pan con aceite en barra.':
      'Restaurants and hospitality: dressings, plating, bar-style bread with oil.',
    'Aliños, tostadas y ensaladas del día a día.':
      'Dressings, toast, and everyday salads.',
    'Una cata en casa: tostadas, tomate y pan. También un regalo redondo.':
      'A tasting at home: toast, tomato, and bread. Also a great all-round gift.',
    'Perfecto para guisos, sofritos, fritos y aliños cotidianos.':
      'Perfect for stews, sautés, frying, and everyday dressings.',
    'Perfecto para guisos, sofritos y para dar un toque firme a platos cocinados.':
      'Perfect for stews, sautés, and to add a firm touch to cooked dishes.',
    'Guisos, fritos, sofritos y aliños diarios. Un aceite versátil para tener siempre en la encimera.':
      'Stews, frying, sautés, and daily dressings. A versatile oil to always keep on the worktop.',
    'Guisos, fritos, sofritos y aliños diarios en grandes cantidades.':
      'Stews, frying, sautés, and daily dressings in large quantities.',
    'Cocina profesional y consumo familiar diario.':
      'Professional cooking and daily family use.',

    /* ─── Validación de formulario ─── */
    'Este campo es obligatorio.': 'This field is required.',
    'Introduce un correo válido.': 'Please enter a valid email.',
    'El mensaje debe tener al menos 10 caracteres.':
      'The message must be at least 10 characters long.',
    'Selecciona una opción.': 'Please select an option.',
    'Introduce un teléfono válido.': 'Please enter a valid phone number.',
    'Revisa este campo.': 'Please check this field.'
  };

  // ----------------------------------------------------------
  // Almacenes para volver al texto original (ES)
  // Las claves son nodos; los valores el texto/atributo ES original.
  // WeakMap = no retiene nodos eliminados del DOM.
  // ----------------------------------------------------------
  const origText = new WeakMap();      // Text node → string ES original
  const origAttr = new WeakMap();      // Element  → { attr → string ES original }

  // ----------------------------------------------------------
  // Reformateo de precios y plurales dinámicos
  //   ES: "12,50 €" / "12,50\u00A0€"
  //   EN: "€12.50"
  // ----------------------------------------------------------
  const PRICE_ES_RE = /(\d+),(\d{2})(?:\s|\u00A0)?€/g;
  const PRICE_EN_RE = /€(\d+)\.(\d{2})/g;
  function priceToEN(s) { return s.replace(PRICE_ES_RE, (_m, a, b) => '€' + a + '.' + b); }
  function priceToES(s) { return s.replace(PRICE_EN_RE, (_m, a, b) => a + ',' + b + '\u00A0€'); }

  function articleToEN(s) {
    return s.replace(/(\d+)\s+artículos?/g, (_m, n) => n + ' ' + (n === '1' ? 'item' : 'items'));
  }

  // Sufijos compuestos dinámicos (toasts, aria-labels generados)
  const SUFFIXES_ES_TO_EN = [
    [' añadido al carrito', ' added to cart'],
    [' del carrito', ' from the cart'],
    ['Ver ficha de ', 'View details of '],
    ['Ver detalle de ', 'View details of '],
    ['Eliminar ', 'Remove '],
    [' / unidad', ' / unit']
  ];

  function applyExtras(s) {
    let out = s;
    for (let i = 0; i < SUFFIXES_ES_TO_EN.length; i++) {
      out = out.split(SUFFIXES_ES_TO_EN[i][0]).join(SUFFIXES_ES_TO_EN[i][1]);
    }
    out = priceToEN(out);
    out = articleToEN(out);
    return out;
  }

  // ----------------------------------------------------------
  // Traducción de un valor (texto plano o atributo)
  //   `original` es siempre la versión ES (la que ya guardamos).
  // ----------------------------------------------------------
  function translateValue(original, toLang) {
    if (original == null) return original;
    if (toLang === 'es') return original;
    const trimmed = original.trim();
    if (!trimmed) return original;
    const mapped = ES_TO_EN[trimmed];
    if (mapped !== undefined) {
      // preservamos los espacios envolventes
      return original.replace(trimmed, mapped);
    }
    // No hay clave exacta. Aplicamos sólo transformaciones seguras
    // (precios, plurales, sufijos compuestos) que no rompen los
    // nombres propios que pueden venir embebidos.
    return applyExtras(original);
  }

  // ----------------------------------------------------------
  // Saltarse subárboles marcados con [data-i18n-skip]
  // o ancestros que ya lo hereden.
  // ----------------------------------------------------------
  function isInsideSkipped(el) {
    let cur = el;
    while (cur && cur.nodeType === 1) {
      if (cur.hasAttribute(SKIP_ATTR)) return true;
      if (elTieneClaseSkip(cur)) return true;
      cur = cur.parentNode;
    }
    return false;
  }

  // ----------------------------------------------------------
  // Traduce un único nodo de texto
  // ----------------------------------------------------------
  function translateTextNode(node, toLang) {
    if (!node || node.nodeType !== 3) return;
    const parent = node.parentNode;
    if (!parent) return;
    if (parent.nodeType === 1 && SKIP_TAGS.has(parent.tagName)) return;
    if (isInsideSkipped(parent)) return;

    if (!origText.has(node)) {
      // Primera vez que vemos este nodo: tomamos su valor actual
      // como referencia ES. Esto funciona porque todo el código
      // del sitio (renders del carrito, modal, toasts, mensajes
      // de validación) escribe siempre en español.
      origText.set(node, node.nodeValue);
    }
    const orig = origText.get(node);
    const nuevo = translateValue(orig, toLang);
    if (node.nodeValue !== nuevo) node.nodeValue = nuevo;
  }

  // ----------------------------------------------------------
  // Traduce un atributo de un elemento
  // ----------------------------------------------------------
  function translateAttr(el, attr, toLang) {
    if (!el.hasAttribute(attr)) return;
    if (isInsideSkipped(el)) return;
    let map = origAttr.get(el);
    if (!map) { map = Object.create(null); origAttr.set(el, map); }
    if (!(attr in map)) map[attr] = el.getAttribute(attr);
    const orig = map[attr];
    const nuevo = translateValue(orig, toLang);
    if (el.getAttribute(attr) !== nuevo) el.setAttribute(attr, nuevo);
  }

  // ----------------------------------------------------------
  // Recorrido del DOM
  // ----------------------------------------------------------
  function walk(node, toLang) {
    if (!node) return;
    if (node.nodeType === 3) { translateTextNode(node, toLang); return; }
    if (node.nodeType !== 1) return;
    if (SKIP_TAGS.has(node.tagName)) return;
    if (node.hasAttribute && node.hasAttribute(SKIP_ATTR)) return;
    if (elTieneClaseSkip(node)) return;

    // Atributos primero
    for (let i = 0; i < ATTRS.length; i++) {
      if (node.hasAttribute(ATTRS[i])) translateAttr(node, ATTRS[i], toLang);
    }
    // Después los hijos
    const kids = node.childNodes;
    for (let i = 0; i < kids.length; i++) walk(kids[i], toLang);
  }

  // ----------------------------------------------------------
  // <title> del documento
  // ----------------------------------------------------------
  function translateTitle(toLang) {
    const t = document.querySelector('title');
    if (!t || !t.firstChild) return;
    translateTextNode(t.firstChild, toLang);
  }

  // ----------------------------------------------------------
  // Estilos del botón
  // ----------------------------------------------------------
  function injectStyles() {
    if (document.getElementById('i18n-style')) return;
    const s = document.createElement('style');
    s.id = 'i18n-style';
    s.textContent = `
      .encabezado__idioma {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        min-width: 44px;
        height: 40px;
        padding: 0 10px;
        border-radius: 999px;
        background: transparent;
        border: 1px solid currentColor;
        color: inherit;
        font-family: var(--fuente-cuerpo, 'Inter', sans-serif);
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 0.08em;
        cursor: pointer;
        transition: background-color .2s ease, color .2s ease, border-color .2s ease;
      }
      .encabezado__idioma:hover {
        background-color: rgba(58, 74, 42, 0.08);
        color: var(--color-oliva-oscuro, #3a4a2a);
      }
      .encabezado__idioma svg {
        width: 14px;
        height: 14px;
        opacity: .75;
      }
      .encabezado__idioma-texto { line-height: 1; }
      @media (max-width: 640px) {
        .encabezado__idioma { padding: 0 8px; min-width: 40px; }
      }
      /* Variante dentro del panel móvil: ocupa fila completa */
      .menu-movil .encabezado__idioma {
        width: 100%;
        height: 48px;
        margin-top: 24px;
        justify-content: center;
      }
    `;
    document.head.appendChild(s);
  }

  // SVG común para los botones
  function botonSvg() {
    return `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
           stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9"/>
        <path d="M3 12h18"/>
        <path d="M12 3a14 14 0 0 1 0 18"/>
        <path d="M12 3a14 14 0 0 0 0 18"/>
      </svg>`;
  }

  // Inyecta un botón. Devuelve el botón inyectado (o el ya existente).
  function injectButton(parent, id, posicion) {
    if (!parent) return null;
    let btn = document.getElementById(id);
    if (btn) return btn;

    btn = document.createElement('button');
    btn.id = id;
    btn.type = 'button';
    btn.className = 'encabezado__idioma';
    // Atributo de skip: el propio botón no debe pasar por la traducción
    // por nodos — la actualización de su texto la hacemos a mano en
    // updateButtons() según el idioma actual.
    btn.setAttribute(SKIP_ATTR, '');
    btn.innerHTML = botonSvg() + '<span class="encabezado__idioma-texto">EN</span>';
    btn.addEventListener('click', toggle);

    if (posicion === 'antes-de-acceso') {
      const acceso = parent.querySelector('.encabezado__acceso');
      if (acceso) parent.insertBefore(btn, acceso);
      else parent.prepend(btn);
    } else {
      parent.appendChild(btn);
    }
    return btn;
  }

  function injectAllButtons() {
    // Botón en la barra de acciones del header
    const acciones = document.querySelector('.encabezado__acciones');
    injectButton(acciones, 'toggle-idioma', 'antes-de-acceso');

    // Botón equivalente dentro del panel móvil, debajo de la lista de links
    const menuMovil = document.getElementById('menu-movil');
    if (menuMovil) {
      // Lo metemos al final del <nav> para que quede bajo los links
      const nav = menuMovil.querySelector('nav') || menuMovil;
      injectButton(nav, 'toggle-idioma-movil', 'final');
    }
  }

  function updateButtons() {
    const etiquetaTexto = current === 'es' ? 'EN' : 'ES';
    const etiquetaAccesible = current === 'es' ? 'Switch to English' : 'Cambiar a español';
    ['toggle-idioma', 'toggle-idioma-movil'].forEach((id) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      const span = btn.querySelector('.encabezado__idioma-texto');
      if (span) span.textContent = etiquetaTexto;
      btn.setAttribute('aria-label', etiquetaAccesible);
      btn.setAttribute('title', etiquetaAccesible);
    });
  }

  // ----------------------------------------------------------
  // Estado, aplicación y observador
  //
  // Estrategia anti-bucle:
  // 1) NO observamos characterData. Nuestros únicos cambios de
  //    valor en text nodes pasan por node.nodeValue = ... que
  //    dispararía characterData. Al no escuchar ese tipo de
  //    mutación, nuestras escrituras ya no se ven reflejadas en
  //    el callback del observador → bucle imposible.
  //
  // 2) Cuando code externo asigna textContent o innerHTML, los
  //    text nodes son reemplazados por nodos nuevos y eso sí
  //    dispara childList — los recogemos y los traducimos.
  //
  // 3) Para nuestras escrituras de atributos (setAttribute),
  //    desconectamos el observador en apply() y lo reconectamos
  //    al terminar. Esto evita la condición de carrera con
  //    actualizaciones de atributos hechas por otros scripts
  //    (main.js, carrito-pagina.js) durante esa misma microtarea.
  // ----------------------------------------------------------
  let current = 'es';
  let observer = null;

  const OBSERVER_CONFIG = {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ATTRS
  };

  function detachObserver() {
    if (observer) observer.disconnect();
  }
  function attachObserver() {
    if (observer && document.body) observer.observe(document.body, OBSERVER_CONFIG);
  }

  function apply(lang) {
    current = (lang === 'en') ? 'en' : 'es';
    document.documentElement.lang = current;
    try { localStorage.setItem(STORAGE_KEY, current); } catch (_e) {}
    // Aislamos nuestras propias mutaciones de atributos.
    detachObserver();
    try {
      if (document.body) walk(document.body, current);
      translateTitle(current);
    } finally {
      attachObserver();
    }
    updateButtons();
  }

  function toggle() {
    apply(current === 'es' ? 'en' : 'es');
  }

  // ----------------------------------------------------------
  // Observador para contenido dinámico
  // ----------------------------------------------------------
  function handleMutations(muts) {
    // Recogemos primero todo y aplicamos en bloque, con el
    // observador desconectado, para que nuestras escrituras
    // (atributos, textos) no provoquen nuevas mutaciones.
    const addedNodes = [];
    const attrChanges = [];

    for (let i = 0; i < muts.length; i++) {
      const m = muts[i];
      if (m.type === 'childList') {
        m.addedNodes.forEach((n) => addedNodes.push(n));
      } else if (m.type === 'attributes') {
        attrChanges.push({ el: m.target, attr: m.attributeName });
      }
    }

    if (!addedNodes.length && !attrChanges.length) return;

    detachObserver();
    try {
      // Atributos: si vienen de fuera, asumimos que el código
      // externo siempre escribe en ES → refrescamos la copia
      // original y aplicamos la traducción actual.
      for (let i = 0; i < attrChanges.length; i++) {
        const { el, attr } = attrChanges[i];
        if (!el || el.nodeType !== 1) continue;
        if (isInsideSkipped(el)) continue;
        const valActual = el.getAttribute(attr);
        if (valActual == null) continue;
        // Reescribimos el "original ES" sólo si el cambio no
        // proviene de nosotros (no podemos saberlo con certeza,
        // pero nuestras propias escrituras coinciden ya con el
        // valor traducido actual: si current==='en' y el valor
        // actual es el traducción que pondríamos, ignoramos).
        const map = origAttr.get(el);
        const prevOrig = map && (attr in map) ? map[attr] : null;
        const traduccionEsperada = prevOrig ? translateValue(prevOrig, current) : null;
        if (traduccionEsperada !== null && traduccionEsperada === valActual) {
          // Es nuestro propio valor; nada que hacer.
          continue;
        }
        // Tomamos el valor actual como nuevo "original ES".
        if (!map) origAttr.set(el, Object.create(null));
        origAttr.get(el)[attr] = valActual;
        translateAttr(el, attr, current);
      }

      // Subárboles añadidos: recorremos.
      for (let i = 0; i < addedNodes.length; i++) {
        const n = addedNodes[i];
        if (!n) continue;
        if (n.nodeType === 1 || n.nodeType === 3) walk(n, current);
      }
    } finally {
      attachObserver();
    }
  }

  function setupObserver() {
    if (!('MutationObserver' in window)) return;
    observer = new MutationObserver(handleMutations);
    attachObserver();
  }

  // ----------------------------------------------------------
  // Boot
  // ----------------------------------------------------------
  function init() {
    injectStyles();
    injectAllButtons();
    const saved = (function () {
      try { return localStorage.getItem(STORAGE_KEY); } catch (_e) { return null; }
    })();
    apply(saved === 'en' ? 'en' : 'es');
    setupObserver();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
