/* ============================================================
   i18n.js — Cambio de idioma ES ⇄ EN
   ============================================================
   • Inyecta un botón "EN/ES" en el header.
   • Mantiene un diccionario ES → EN y traduce nodos de texto +
     atributos visibles (aria-label, placeholder, alt, title).
   • Persiste la elección en localStorage ('idioma').
   • Observa cambios del DOM para re-traducir contenido
     dinámico (modal de producto, filas del carrito, toasts,
     mensajes de formulario, etc.).
   ============================================================ */

(function () {
  'use strict';

  const STORAGE_KEY = 'idioma';
  const ATTRS = ['aria-label', 'placeholder', 'title', 'alt'];
  const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME']);

  // ----------------------------------------------------------
  // DICCIONARIO ES → EN (texto literal, recortado en ambos
  // extremos para la búsqueda). Si una clave existe, su valor
  // sustituye al texto al cambiar al inglés.
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
    'SCA Virgen de la Cabeza · Aceite de montaña de Montejícar desde 1963 · v2':
      'SCA Virgen de la Cabeza · Mountain Olive Oil from Montejícar since 1963 · v2',
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
    'La cooperativa · SCA Virgen de la Cabeza · v2':
      'The Cooperative · SCA Virgen de la Cabeza · v2',
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
    'Tienda · SCA Virgen de la Cabeza · v2': 'Shop · SCA Virgen de la Cabeza · v2',
    'Venta directa en origen': 'Direct sale at origin',
    'Compra aceite directamente en origen': 'Buy oil directly at origin',
    'Recibe en casa el aceite de oliva virgen extra de nuestra cooperativa.\n          Venta directa desde Montejícar, en el corazón de los Montes de Granada.':
      'Receive at home the extra virgin olive oil from our cooperative. Direct sale from Montejícar, in the heart of the Montes de Granada.',
    'Nuestras referencias más cuidadas, en formatos y presentaciones especiales.\n              Producción limitada de campaña, también perfectas para regalar.':
      'Our most carefully crafted references, in special formats and presentations. Limited campaign production, also perfect as a gift.',
    'Selección': 'Selection',
    'Monovarietales con carácter, para realzar platos en crudo.\n              Tostadas, ensaladas, carpaccios, gazpachos.':
      'Single-variety oils with character, to enhance raw dishes. Toasts, salads, carpaccios, gazpachos.',
    'Uso diario': 'Daily use',
    'Aceites equilibrados y versátiles, pensados para la cocina diaria.\n              Ideales para guisos, fritos y aliños cotidianos.':
      'Balanced and versatile oils, designed for daily cooking. Ideal for stews, frying, and everyday dressings.',
    'Añadir al carrito': 'Add to cart',
    'Único Frutado · Estuche regalo': 'Único Frutado · Gift Box',
    'Único Coupage Frutado · Caja': 'Único Coupage Frutado · Box',
    'DCOOP Selección Picual': 'DCOOP Selección Picual',
    'Olixicar Picual': 'Olixicar Picual',
    'DCOOP Selección Arbequina': 'DCOOP Selección Arbequina',
    'DCOOP Selección Hojiblanca': 'DCOOP Selección Hojiblanca',
    'DCOOP Especial · Lata': 'DCOOP Especial · Tin',
    'DCOOP Especial Cooperativas': 'DCOOP Especial Cooperativas',
    'DCOOP Monovarietal Selección · Caja': 'DCOOP Monovarietal Selección · Box',
    'AOVE Coupage': 'EVOO Coupage',
    'Olixicar · Caja': 'Olixicar · Box',
    'Hojiblanca temprana · 500 ml': 'Early Hojiblanca · 500 ml',
    'Hojiblanca temprana · estuche 500 ml': 'Early Hojiblanca · 500 ml gift box',
    'Coupage frutado · caja 6 × 500 ml': 'Fruity coupage · case of 6 × 500 ml',
    'Picual · 500 ml': 'Picual · 500 ml',
    'Arbequina · 250 ml': 'Arbequina · 250 ml',
    'Hojiblanca · 250 ml': 'Hojiblanca · 250 ml',
    'Coupage · lata 3 L': 'Coupage · 3 L tin',
    'Coupage · botella': 'Coupage · bottle',
    'Picual · Hojiblanca · Arbequina · caja 3 × 500 ml':
      'Picual · Hojiblanca · Arbequina · case of 3 × 500 ml',
    'Coupage · 1 l': 'Coupage · 1 L',
    'Coupage · 5 l': 'Coupage · 5 L',
    'Coupage · 1 L': 'Coupage · 1 L',
    'Coupage · 5 L': 'Coupage · 5 L',
    'Picual · 5 l': 'Picual · 5 L',
    'Coupage · caja 5 L': 'Coupage · 5 L case',
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
    'Productos agrícolas · SCA Virgen de la Cabeza · v2':
      'Agricultural Products · SCA Virgen de la Cabeza · v2',
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
    '[HORARIO PENDIENTE]': '[HOURS PENDING]',
    'Ver mapa y contacto': 'See map and contact',

    /* ─── CONTACTO ─── */
    'Contacto · SCA Virgen de la Cabeza · v2': 'Contact · SCA Virgen de la Cabeza · v2',
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
    '[HORARIO HABITUAL PENDIENTE]': '[USUAL HOURS PENDING]',
    'En campaña de aceituna: [HORARIO AMPLIADO PENDIENTE]':
      'During olive harvest season: [EXTENDED HOURS PENDING]',
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
    'DIRECCIÓN COMPLETA PENDIENTE': '[FULL ADDRESS PENDING]',
    'Nº DE INSCRIPCIÓN PENDIENTE — Registro de Cooperativas Andaluzas':
      '[REGISTRATION NUMBER PENDING] — Registry of Andalusian Cooperatives',
    'Aviso legal completo': 'Full legal notice',
    'Política de privacidad': 'Privacy policy',
    'Política de cookies': 'Cookie policy',
    'Ubicación de la cooperativa Virgen de la Cabeza en Montejícar, Granada':
      'Location of the Virgen de la Cabeza cooperative in Montejícar, Granada',

    /* ─── CARRITO ─── */
    'Tu carrito · SCA Virgen de la Cabeza · v2':
      'Your Cart · SCA Virgen de la Cabeza · v2',
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
    'Aviso legal y privacidad · SCA Virgen de la Cabeza · v2':
      'Legal Notice and Privacy Policy · SCA Virgen de la Cabeza · v2',
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

    /* ─── Validación de formulario ─── */
    'Este campo es obligatorio.': 'This field is required.',
    'Introduce un correo válido.': 'Please enter a valid email.',
    'El mensaje debe tener al menos 10 caracteres.':
      'The message must be at least 10 characters long.'
  };

  // Inverso EN → ES (para volver atrás)
  const EN_TO_ES = Object.create(null);
  Object.keys(ES_TO_EN).forEach((k) => { EN_TO_ES[ES_TO_EN[k]] = k; });

  // ----------------------------------------------------------
  // Almacenes para volver al texto original
  // ----------------------------------------------------------
  const origText = new WeakMap();       // Text node → string original (ES)
  const origAttr = new WeakMap();       // Element → { attr → string original }

  // ----------------------------------------------------------
  // Reformateo de precios
  //   ES: "12,50 €" / "12,50\u00A0€"
  //   EN: "€12.50"
  // ----------------------------------------------------------
  const PRICE_ES_RE = /(\d+),(\d{2})(?:\s|\u00A0)?€/g;
  const PRICE_EN_RE = /€(\d+)\.(\d{2})/g;
  function priceToEN(s) { return s.replace(PRICE_ES_RE, (_m, a, b) => '€' + a + '.' + b); }
  function priceToES(s) { return s.replace(PRICE_EN_RE, (_m, a, b) => a + ',' + b + '\u00A0€'); }

  // "X artículo(s)" → "X item(s)"
  function articleToEN(s) {
    return s.replace(/(\d+)\s+artículos?/g, (_m, n) => n + ' ' + (n === '1' ? 'item' : 'items'));
  }
  function articleToES(s) {
    return s.replace(/(\d+)\s+items?/g, (_m, n) => n + ' ' + (n === '1' ? 'artículo' : 'artículos'));
  }

  // Sufijos compuestos dinámicos (toast, etc.)
  const SUFFIXES = [
    { es: ' añadido al carrito', en: ' added to cart' },
    { es: ' del carrito', en: ' from the cart' },
    { es: 'Ver ficha de ', en: 'View details of ' },
    { es: 'Ver detalle de ', en: 'View details of ' },
    { es: 'Eliminar ', en: 'Remove ' },
    { es: ' / unidad', en: ' / unit' }
  ];

  function applyExtras(s, dir /* 'en'|'es' */) {
    let out = s;
    if (dir === 'en') {
      SUFFIXES.forEach((p) => { out = out.split(p.es).join(p.en); });
      out = priceToEN(out);
      out = articleToEN(out);
    } else {
      SUFFIXES.forEach((p) => { out = out.split(p.en).join(p.es); });
      out = priceToES(out);
      out = articleToES(out);
    }
    return out;
  }

  // ----------------------------------------------------------
  // Traducción de un valor (texto plano o atributo)
  //   `original` es siempre la versión ES.
  // ----------------------------------------------------------
  function translateValue(original, toLang) {
    if (toLang === 'es') return original;
    if (original == null) return original;
    const trimmed = original.trim();
    if (!trimmed) return original;
    const mapped = ES_TO_EN[trimmed];
    if (mapped !== undefined) {
      // preserva espacios envolventes
      return original.replace(trimmed, mapped);
    }
    return applyExtras(original, 'en');
  }

  // ----------------------------------------------------------
  // Traduce un nodo de texto
  // ----------------------------------------------------------
  function translateTextNode(node, toLang) {
    if (!node || node.nodeType !== 3) return;
    if (node.parentNode && SKIP_TAGS.has(node.parentNode.tagName)) return;
    if (!origText.has(node)) origText.set(node, node.nodeValue);
    const orig = origText.get(node);
    node.nodeValue = translateValue(orig, toLang);
  }

  // ----------------------------------------------------------
  // Traduce un atributo
  // ----------------------------------------------------------
  function translateAttr(el, attr, toLang) {
    if (!el.hasAttribute(attr)) return;
    let map = origAttr.get(el);
    if (!map) { map = Object.create(null); origAttr.set(el, map); }
    if (!(attr in map)) map[attr] = el.getAttribute(attr);
    const orig = map[attr];
    el.setAttribute(attr, translateValue(orig, toLang));
  }

  // ----------------------------------------------------------
  // Recorrido del DOM
  // ----------------------------------------------------------
  function walk(node, toLang) {
    if (!node) return;
    if (node.nodeType === 3) { translateTextNode(node, toLang); return; }
    if (node.nodeType !== 1) return;
    if (SKIP_TAGS.has(node.tagName)) return;
    // Atributos
    for (let i = 0; i < ATTRS.length; i++) {
      if (node.hasAttribute(ATTRS[i])) translateAttr(node, ATTRS[i], toLang);
    }
    // Hijos
    const kids = node.childNodes;
    for (let i = 0; i < kids.length; i++) walk(kids[i], toLang);
  }

  // ----------------------------------------------------------
  // <title> y <html lang>
  // ----------------------------------------------------------
  function translateTitle(toLang) {
    const t = document.querySelector('title');
    if (!t) return;
    if (!origText.has(t.firstChild || t)) {
      // El title suele tener un solo Text child
      if (t.firstChild) origText.set(t.firstChild, t.firstChild.nodeValue);
    }
    if (t.firstChild) translateTextNode(t.firstChild, toLang);
  }

  // ----------------------------------------------------------
  // Botón en el header
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
    `;
    document.head.appendChild(s);
  }

  function injectButton() {
    if (document.getElementById('toggle-idioma')) return;
    const acciones = document.querySelector('.encabezado__acciones');
    if (!acciones) return;

    const btn = document.createElement('button');
    btn.id = 'toggle-idioma';
    btn.type = 'button';
    btn.className = 'encabezado__idioma';
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9"/>
        <path d="M3 12h18"/>
        <path d="M12 3a14 14 0 0 1 0 18"/>
        <path d="M12 3a14 14 0 0 0 0 18"/>
      </svg>
      <span class="encabezado__idioma-texto">EN</span>
    `;
    btn.addEventListener('click', toggle);

    // Lo insertamos antes del bloque de acceso socios
    const acceso = acciones.querySelector('.encabezado__acceso');
    if (acceso) acciones.insertBefore(btn, acceso);
    else acciones.prepend(btn);
  }

  function updateButton() {
    const btn = document.getElementById('toggle-idioma');
    if (!btn) return;
    const span = btn.querySelector('.encabezado__idioma-texto');
    if (span) span.textContent = current === 'es' ? 'EN' : 'ES';
    btn.setAttribute('aria-label',
      current === 'es' ? 'Switch to English' : 'Cambiar a español');
    btn.setAttribute('title',
      current === 'es' ? 'Switch to English' : 'Cambiar a español');
  }

  // ----------------------------------------------------------
  // Estado e inicialización
  // ----------------------------------------------------------
  let current = 'es';

  function apply(lang) {
    current = (lang === 'en') ? 'en' : 'es';
    document.documentElement.lang = current;
    try { localStorage.setItem(STORAGE_KEY, current); } catch (_e) {}
    if (document.body) walk(document.body, current);
    translateTitle(current);
    updateButton();
  }

  function toggle() { apply(current === 'es' ? 'en' : 'es'); }

  // ----------------------------------------------------------
  // Observador para contenido dinámico
  // ----------------------------------------------------------
  function setupObserver() {
    if (!('MutationObserver' in window)) return;
    const mo = new MutationObserver((muts) => {
      for (let i = 0; i < muts.length; i++) {
        const m = muts[i];
        if (m.type === 'childList') {
          m.addedNodes.forEach((n) => walk(n, current));
        } else if (m.type === 'attributes') {
          // El atributo cambió desde fuera — actualizamos el "original"
          // y traducimos de nuevo.
          const el = m.target;
          let map = origAttr.get(el);
          if (!map) { map = Object.create(null); origAttr.set(el, map); }
          // Si estamos en EN, asumimos que el cambio externo es el nuevo
          // valor "EN". Para evitar bucles infinitos, sólo guardamos el
          // valor cuando es la primera vez que vemos el atributo.
          if (!(m.attributeName in map)) {
            const val = el.getAttribute(m.attributeName);
            // Si actualmente estamos en EN, asumimos que es la versión EN
            // y guardamos la inversa.
            if (current === 'en' && EN_TO_ES[val && val.trim()]) {
              map[m.attributeName] = EN_TO_ES[val.trim()];
            } else {
              map[m.attributeName] = val;
            }
          }
          if (current !== 'es') translateAttr(el, m.attributeName, current);
        } else if (m.type === 'characterData') {
          const node = m.target;
          // Si el texto cambió por código externo y estamos en EN,
          // significa que el código escribió en ES — re-traducimos.
          // Para detectar correctamente, "olvidamos" el original anterior.
          if (current === 'en') {
            const newVal = node.nodeValue;
            // si el valor coincide con una clave EN→ES conocida, no toques
            const trimmed = (newVal || '').trim();
            if (trimmed && EN_TO_ES[trimmed]) {
              // ya está en EN, sólo guarda el original ES
              if (!origText.has(node)) origText.set(node, EN_TO_ES[trimmed]);
              return;
            }
            origText.set(node, newVal);
            translateTextNode(node, current);
          } else {
            // En ES, almacenamos el último valor como original.
            origText.set(node, node.nodeValue);
          }
        }
      }
    });
    mo.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ATTRS
    });
  }

  // ----------------------------------------------------------
  // Boot
  // ----------------------------------------------------------
  function init() {
    injectStyles();
    injectButton();
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
