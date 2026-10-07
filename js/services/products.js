const priceFormat = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

const TAGS = {
  preventa: 'Preventa',
  lanzamiento: 'Lanzamiento',
  nuevo: 'Nuevo',
  proximamente: 'Próximamente',
  promocion: 'Promoción'
};

export async function getProducts(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Servicio de productos ${url}: ${response.status}`);
  }

  const { products = [] } = await response.json();

  return products.map((product) => toCardAttributes(product, url)).filter(Boolean);
}

export function createItemList(products) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: products.map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: product.name,
      url: product.href
    }))
  };
}

function toCardAttributes(product, serviceUrl) {
  const offer = product.productOfferingPrice?.[0]?.bundledPop?.[0];
  const price = Number(offer?.price?.value);

  if (!price) {
    return null;
  }

  const oldPrice = Number(offer.maxPrice?.value);
  const image = product.images?.find(({ format }) => format === 'product') ?? product.images?.[0];
  const tagVariant = Object.keys(TAGS).find((flag) => product[flag]);

  return {
    // Las imágenes llegan relativas al dominio de la tienda, el mismo de pdpUrl.
    image: image && new URL(image.url, product.pdpUrl ?? serviceUrl).href,
    brand: product.marca,
    model: product.modelo,
    name: product.nombreComercial || product.name,
    capacity: product.capacidad?.value,
    color: product.colorName,
    'color-hex': product.color,
    'old-price': oldPrice > price ? priceFormat.format(oldPrice) : null,
    price: priceFormat.format(price),
    installments: toText(product.leyendaMSI),
    tag: TAGS[tagVariant],
    'tag-variant': tagVariant,
    gift: product.includeGift ? '+1 regalo' : null,
    'free-shipping': product.isFreeShipping,
    href: product.pdpUrl,
    colors: toColors(product.variants)
  };
}

function toText(html) {
  return html ? new DOMParser().parseFromString(html, 'text/html').body.textContent.trim() : null;
}

// El servicio envía las variantes como texto con comillas simples, no como JSON.
function toColors(variants) {
  try {
    const list = typeof variants === 'string' ? JSON.parse(variants.replaceAll("'", '"')) : variants;

    return (list ?? [])
      .map(({ HEXADECIMAL, NAME }) => ({ name: NAME, hex: HEXADECIMAL }))
      .filter(({ hex }) => hex);
  } catch {
    return [];
  }
}
