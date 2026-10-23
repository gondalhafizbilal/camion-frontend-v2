export type GetCurrentCustomerReturnRequestsVariables = {
  currency?: string | null;
  language?: string | null;
};

export const GET_CURRENT_CUSTOMER_RETURN_REQUESTS = `
query GetCurrentCustomerReturnRequests($currency: String, $language: String) {
  getCurrentCustomerReturnRequests {
    uuid
    order {
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
    }
    orderItem {
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
      }
    }
    reason
    reasonDetail
    status
    adminNote
    refundAmount {
      amount
      minorAmount
      currencyCode
    }
    evidence {
      uuid
      url
      mimeType
    }
  }
}
`.trim();

export type GetCurrentCustomerReturnRequestVariables = {
  uuid: string;
  currency?: string | null;
  language?: string | null;
};

export const GET_CURRENT_CUSTOMER_RETURN_REQUEST = `
query GetCurrentCustomerReturnRequest($uuid: String!, $currency: String, $language: String) {
  getCurrentCustomerReturnRequest(uuid: $uuid) {
    uuid
    order {
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
    }
    orderItem {
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
      }
    }
    reason
    reasonDetail
    status
    adminNote
    refundAmount {
      amount
      minorAmount
      currencyCode
    }
    evidence {
      uuid
      url
      mimeType
    }
  }
}
`.trim();

