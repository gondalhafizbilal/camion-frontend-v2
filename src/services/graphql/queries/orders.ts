export type GetCurrentCustomerOrdersVariables = {
  pageNumber?: number | null;
  itemsPerPage?: number | null;
  currency?: string | null;
  language?: string | null;
};

const customerOrderListFields = `
    uuid
    status
    subTotal {
      amount
      minorAmount
      currencyCode
    }
    shippingCost {
      amount
      minorAmount
      currencyCode
    }
    discount {
      amount
      minorAmount
      currencyCode
    }
    total {
      amount
      minorAmount
      currencyCode
    }
    eta
    tracking {
      stage
      status
      waybillNo
    }
    orderPlacementDate
    shippingAddress {
      uuid
      fullName
      country
      city
      state
      apartment
      streetAddress
      zipCode
      phoneNumber
    }
    orderItems {
      uuid
      price {
        amount
        minorAmount
        currencyCode
      }
      discountedPrice {
        amount
        minorAmount
        currencyCode
      }
      quantity
      total {
        amount
        minorAmount
        currencyCode
      }
      product {
        uuid
        slug
        title(language: $language)
        brief(language: $language)
        description(language: $language)
        descriptionHtml(language: $language)
        featuredImageUrl
        featuredThumbnailUrl
        status
      }
      variant {
        uuid
        title(language: $language)
        sku
        barcode
        price(currency: $currency) {
          amount
          minorAmount
          currencyCode
        }
        discountedPrice(currency: $currency) {
          amount
          minorAmount
          currencyCode
        }
        weight {
          amount
          unit
        }
        dimensions {
          width
          height
          length
        }
        images {
          uuid
          imageUrl
          thumbnailUrl
          alt
          isFeatured
          position
        }
      }
    }
`;

export const GET_CURRENT_CUSTOMER_ORDERS = `
query GetCurrentCustomerOrders($pageNumber: Int, $itemsPerPage: Int, $currency: String, $language: String) {
  getCurrentCustomerOrders(pageNumber: $pageNumber, itemsPerPage: $itemsPerPage) {
${customerOrderListFields}
  }
}
`.trim();

export type GetCurrentCustomerOrderVariables = {
  uuid: string;
  currency?: string | null;
  language?: string | null;
};

export const GET_CURRENT_CUSTOMER_ORDER = `
query GetCurrentCustomerOrder($uuid: String!, $currency: String, $language: String) {
  getCurrentCustomerOrder(uuid: $uuid) {
    uuid
    status
    subTotal {
      amount
      minorAmount
      currencyCode
    }
    shippingCost {
      amount
      minorAmount
      currencyCode
    }
    discount {
      amount
      minorAmount
      currencyCode
    }
    total {
      amount
      minorAmount
      currencyCode
    }
    eta
    tracking {
      stage
      status
      waybillNo
    }
    orderPlacementDate
    shippingAddress {
      uuid
      fullName
      country
      city
      state
      apartment
      streetAddress
      zipCode
      phoneNumber
    }
    orderItems {
      uuid
      price {
        amount
        minorAmount
        currencyCode
      }
      discountedPrice {
        amount
        minorAmount
        currencyCode
      }
      quantity
      total {
        amount
        minorAmount
        currencyCode
      }
      product {
        uuid
        slug
        title(language: $language)
        brief(language: $language)
        description(language: $language)
        descriptionHtml(language: $language)
        featuredImageUrl
        featuredThumbnailUrl
        status
        productCategories {
          category {
            uuid
            slug
            name
            nameEn
            nameAr
            thumbnailUrl
          }
        }
      }
      variant {
        uuid
        title(language: $language)
        sku
        barcode
        price(currency: $currency) {
          amount
          minorAmount
          currencyCode
        }
        discountedPrice(currency: $currency) {
          amount
          minorAmount
          currencyCode
        }
        weight {
          amount
          unit
        }
        dimensions {
          width
          height
          length
        }
        images {
          uuid
          imageUrl
          thumbnailUrl
          alt
          isFeatured
          position
        }
        optionValues {
          optionValue {
            uuid
            value(language: $language)
            position
            option {
              uuid
              name(language: $language)
              position
            }
          }
        }
      }
    }
  }
}
`.trim();

export type GetOrderTrackingVariables = {
  uuid: string;
  language?: string | null;
};

export const GET_ORDER_TRACKING = `
query GetOrderTracking($uuid: String!, $language: String) {
  getOrderTracking(uuid: $uuid, language: $language) {
    id
    name
    checked
    date
    metadata {
      trackingId
      cancellationReason
      reviewText
      reviewRating
    }
  }
}
`.trim();

export type GetCurrentCustomerOrderPreviewVariables = {
  language?: string | null;
  currency?: string | null;
  couponCode?: string | null;
};

export const GET_CURRENT_CUSTOMER_ORDER_PREVIEW = `
query GetCurrentCustomerOrderPreview($language: String, $currency: String, $couponCode: String) {
  getCurrentCustomerOrderPreview(language: $language, currency: $currency, couponCode: $couponCode) {
    items {
      uuid
      quantity
      product {
        uuid
        slug
        title(language: $language)
        brief(language: $language)
        description(language: $language)
        descriptionHtml(language: $language)
        featuredImageUrl
        featuredThumbnailUrl
        status
        salesCount
        likesCount
        reviewsCount
        ratingAvg
        ratingOneStarCount
        ratingTwoStarCount
        ratingThreeStarCount
        ratingFourStarCount
        ratingFiveStarCount
      }
      variant {
        uuid
        title
        sku
        barcode
        price(currency: $currency) {
          amount
          minorAmount
          currencyCode
        }
        discountedPrice(currency: $currency) {
          amount
          minorAmount
          currencyCode
        }
        weight {
          amount
          unit
        }
        dimensions {
          width
          height
          length
          unit
        }
        images {
          uuid
          imageUrl
          thumbnailUrl
          alt
          isFeatured
          position
        }
        optionValues {
          optionValue {
            uuid
            value(language: $language)
            position
            option {
              uuid
              name(language: $language)
              position
            }
          }
        }
      }
    }
    shippingAddress {
      uuid
      fullName
      phoneNumber
      streetAddress
      apartment
      zipCode
      city
      state
      country
      isDefault
    }
    cart_total
    discount
    shippingTotal
    grand_total
    eta
    orderTotalWarning
  }
}
`.trim();

export type GetCurrentCustomerOrderPreviewV2Variables = {
  language?: string | null;
  currency?: string | null;
  couponCode?: string | null;
  cartItemUuids?: string[] | null;
};

export const GET_CURRENT_CUSTOMER_ORDER_PREVIEW_V2 = `
query GetCurrentCustomerOrderPreviewV2($language: String, $currency: String, $couponCode: String, $cartItemUuids: [String!]) {
  getCurrentCustomerOrderPreviewV2(language: $language, currency: $currency, couponCode: $couponCode, cartItemUuids: $cartItemUuids) {
    items {
      uuid
      product {
        uuid
        slug
        title(language: $language)
        brief(language: $language)
        description(language: $language)
        descriptionHtml(language: $language)
        featuredImageUrl
        featuredThumbnailUrl
        status
        salesCount
        likesCount
        reviewsCount
        ratingAvg
        ratingOneStarCount
        ratingTwoStarCount
        ratingThreeStarCount
        ratingFourStarCount
        ratingFiveStarCount
      }
      variant {
        uuid
        title
        sku
        barcode
        price(currency: $currency) {
          amount
          minorAmount
          currencyCode
        }
        discountedPrice(currency: $currency) {
          amount
          minorAmount
          currencyCode
        }
        weight {
          amount
          unit
        }
        dimensions {
          width
          height
          length
          unit
        }
        images {
          uuid
          imageUrl
          thumbnailUrl
          alt
          isFeatured
          position
        }
        optionValues {
          optionValue {
            uuid
            value(language: $language)
            position
            option {
              uuid
              name(language: $language)
              position
            }
          }
        }
      }
      availableStock
      quantity
      subTotal {
        amount
        minorAmount
        currencyCode
      }
      discountPrice {
        amount
        minorAmount
        currencyCode
      }
      total {
        amount
        minorAmount
        currencyCode
      }
    }
    shippingAddress {
      uuid
      fullName
      phoneNumber
      streetAddress
      apartment
      zipCode
      city
      state
      country
      isDefault
    }
    cart_total
    discount
    shippingTotal
    grand_total
    eta
    orderTotalWarning
  }
}
`.trim();
