// instagramScraper.ts — Provee los datos e imágenes reales de Instagram con almacenamiento local garantizado
export interface InstagramPostData {
  url: string;
  image: string;
  caption: string;
  author: string;
  tag?: string;
}

// Registro permanente de publicaciones oficiales con imágenes locales de alta resolución
export const KNOWN_POSTS: Record<string, InstagramPostData> = {
  'DeJ3WnKibil': {
    url: 'https://www.instagram.com/p/DeJ3WnKibil/',
    image: '/assets/img/posts/post-convocatoria.jpg',
    caption: '📢 ¡𝗖𝗼𝗻𝘃𝗼𝗰𝗮𝘁𝗼𝗿𝗶𝗮 𝗮𝗯𝗶𝗲𝗿𝘁𝗮❗ Forma tu equipo, prepárate para asumir nuevos retos y vive una experiencia diseñada para poner a prueba tu creatividad, estrategia y capacidad de innovación. ¿Estás listo para ser parte? 🔥 #MarketingWeek #ConvocatoriaAbierta #Univalle',
    author: 'marketing_week_univallesucre',
    tag: 'CONVOCATORIA'
  },
  'DeJ3EqZispQ': {
    url: 'https://www.instagram.com/p/DeJ3EqZispQ/',
    image: '/assets/img/posts/post-botarga.jpg',
    caption: '𝗬𝗮 𝗰𝗼𝗻𝗼𝗰𝗶𝘀𝘁𝗲 𝗮𝗹 𝗠𝗮𝗿𝗸𝗶 𝗩𝗮𝗹𝗹𝗲 𝗰𝗼𝗻 𝘀𝘂 𝗯𝗼𝘁𝗮𝗿𝗴𝗮 𝗲𝗻 𝗹𝗮 𝗠𝗮𝗿𝗸𝗲𝘁𝗶𝗻𝗴 𝗪𝗲𝗲𝗸❓ 👀🐊 Algo grande se está cocinando y este personaje viene a acompañarnos en una semana llena de creatividad, retos, aprendizaje y mucha estrategia. 🚀 #MarketingWeek #Botargas',
    author: 'marketing_week_univallesucre',
    tag: 'BOTARGA'
  },
  'DeJ24NhCMI6': {
    url: 'https://www.instagram.com/p/DeJ24NhCMI6/',
    image: '/assets/img/posts/post-lanzamiento.jpg',
    caption: '𝗟𝗮 𝗠𝗮𝗿𝗸𝗲𝘁𝗶𝗻𝗴 𝗪𝗲𝗲𝗸 𝘆𝗮 𝗲𝘀 𝘂𝗻𝗮 𝗿𝗲𝗮𝗹𝗶𝗱𝗮𝗱. 💥 Prepárate para una experiencia donde podrás crear, aprender, competir y demostrar todo tu potencial junto a otros estudiantes apasionados por el marketing. Muy pronto conocerás todas las sorpresas. 👀✨ #MarketingWeek',
    author: 'marketing_week_univallesucre',
    tag: 'LANZAMIENTO'
  },
  'DeDvoDhxC3x': {
    url: 'https://www.instagram.com/p/DeDvoDhxC3x/',
    image: '/assets/img/posts/post-aliado.jpg',
    caption: '🎙️ ¡Seguimos sumando aliados! Nos complace anunciar a EN MEDIO @enmedio_live como 𝗮𝗹𝗶𝗮𝗱𝗼 𝗼𝗳𝗶𝗰𝗶𝗮𝗹 𝗱𝗲 𝗲𝘀𝘁𝗮 𝗴𝗿𝗮𝗻 𝗮𝗰𝘁𝗶𝘃𝗶𝗱𝗮𝗱. Un espacio dedicado a conversar sobre actualidad, deportes y entretenimiento para conectar ideas y comunidad. 🚀 #AliadoOficial #EnMedio',
    author: 'marketing_week_univallesucre',
    tag: 'ALIADOS'
  },
  'DeD2bguDvio': {
    url: 'https://www.instagram.com/p/DeD2bguDvio/',
    image: '/assets/img/posts/post-dj.jpg',
    caption: '🎧 ¡DJ OFICIAL CONFIRMADO! La energía de la MkgWk ya tiene sonido propio. Damos la bienvenida a @soti_beats como nuestro DJ oficial confirmado para ponerle ritmo y ambiente a toda la semana. Prepárense para una experiencia inolvidable. 🔥🎶',
    author: 'soti_beats',
    tag: 'DJ SET'
  }
};

export async function fetchInstagramPost(rawUrl: string): Promise<InstagramPostData> {
  const cleanUrl = rawUrl.split('?')[0].replace(/\/+$/, '');
  const shortcodeMatch = cleanUrl.match(/\/p\/([A-Za-z0-9_-]+)/);
  const shortcode = shortcodeMatch ? shortcodeMatch[1] : '';

  if (shortcode && KNOWN_POSTS[shortcode]) {
    return { ...KNOWN_POSTS[shortcode] };
  }

  // Si se ingresa una URL nueva desconocida, intentar scraping en tiempo real
  try {
    const res = await fetch(`${cleanUrl}/embed/captioned/`);
    if (res.ok) {
      const html = await res.text();
      const embeddedMediaMatch = html.match(/class=["']EmbeddedMediaImage["'][^>]*src=["']([^"']+)["']/i);
      const anyPostImage = html.match(/https:\/\/[^"'\s<>]+fbcdn\.net\/v\/[^"'\s<>]+_n\.(jpg|webp)[^"'\s<>]*/i);
      const captionMatch = html.match(/class=["']Caption["'][^>]*>([\s\S]*?)<\/div>/i);
      
      let image = '/img/campus.jpg';
      if (embeddedMediaMatch) {
        image = embeddedMediaMatch[1].replace(/&amp;/g, '&');
      } else if (anyPostImage) {
        image = anyPostImage[0].replace(/&amp;/g, '&');
      }

      let caption = 'Publicación oficial de Marketing Week Univalle Sucre.';
      if (captionMatch) {
        caption = captionMatch[1]
          .replace(/<a[^>]*class=["']CaptionUsername["'][^>]*>[\s\S]*?<\/a>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/&#064;/g, '@')
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/\s+/g, ' ')
          .trim();
      }

      const authorMatch = html.match(/class=["']UsernameText["']>([^<]+)<\/span>/i);
      const author = authorMatch ? authorMatch[1].trim() : 'marketing_week_univallesucre';

      return {
        url: cleanUrl,
        image,
        caption,
        author
      };
    }
  } catch {}

  return {
    url: cleanUrl,
    image: '/img/campus.jpg',
    caption: 'Publicación oficial de Marketing Week Univalle Sucre.',
    author: 'marketing_week_univallesucre'
  };
}
