// import { Sequelize } from 'sequelize-typescript';
// import 'dotenv/config';

const { Sequelize } = require('sequelize');
// Op

const sequelize = new Sequelize(process.env.URI,
  // { logging: false }
);

const auth = async () => {
  try {
    await sequelize.authenticate()
  } catch (error) {
    console.error('Cannot connect to DB', error);
  }
};
auth();

const getProducts = async (product_id) => {
  // get features from features table
  const [featureResults, featureMetadata] = await sequelize.query(
    `SELECT feature, value FROM features WHERE "product_id" = ${product_id};`
  )
  // get product info from product table
  const [productResults, productMetadata] = await sequelize.query(
    `SELECT * FROM product WHERE "id" = ${product_id};`
  )

  const product = productResults[0];
  product.features = featureResults;

  return product;
}

const getRelated = async (product_id) => {
  // get id's related to product_id
  const [results, metadata] = await sequelize.query(
    `SELECT related_product_id FROM related WHERE "current_product_id" = ${product_id};`
  )

  const relatedIds = [];

  results.forEach((relatedProduct) => {
    relatedIds.push(relatedProduct.related_product_id);
  })

  return relatedIds;
}

const getStyles = async (product_id) => {

  const [styleResults, styleMetadata] = await sequelize.query(
    `SELECT id, name, sale_price, original_price, default_style FROM styles WHERE "productId" = ${product_id}`
  )

  let skuPromises = styleResults.map((style) => {
    // renames the "id" keyname to "style_id"
    delete Object.assign(style, { ['style_id']: style['id'] })['id'];
    // renames the "default_style" keyname to "default?" and gives it a true or false value instead of 1 or 0
    delete Object.assign(style, { ['default?']: !!style['default_style'] })['default_style'];

    return getSkus(style.style_id);
  })

  const styles = await Promise.all(skuPromises)
    .then((result) => {
      styleResults.forEach(async (style, i) => {
        style.skus = result[i];
      })

      let stylesObject = {
        product_id: product_id,
        results: styleResults
      };
      return stylesObject;
    })
    .catch((err) => {
      console.log('Error getting Skus', err);
    })

  let photoPromises = styles.results.map((style) => {
    return getPhotos(style.style_id);
  });

  return Promise.all(photoPromises)
    .then((result) => {
      styles.results.forEach((style, i) => {
        style.photos = result[i];
      })
    })
    .then(() => {
      return styles;
    })
    .catch((err) => {
      console.log('Error getting Photos', err);
    })
}

const getSkus = async (style_id) => {
  let [skuResults, skuMetadata] = await sequelize.query(
    `SELECT id, size, quantity FROM skus WHERE "styleId" = ${style_id}`
  )

  let skus = {};

  skuResults.forEach((sku) => {
    skus[sku.id] = {
      quantity: sku.quantity,
      size: sku.size
    }
  })

  return skus;
}

const getPhotos = async (style_id) => {
  let [photoResults, photoMetadata] = await sequelize.query(
    `SELECT url, thumbnail_url FROM photos_fixed WHERE "styleId" = ${style_id};`
  )
  return photoResults;
}

module.exports = {
  sequelize,
  getProducts,
  getRelated,
  getStyles,
  getSkus,
};
