import {
  StyleSheet,
  Image,
  Platform,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";

import { Collapsible } from "@/components/Collapsible";
import { ExternalLink } from "@/components/ExternalLink";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import React, { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Search, X } from "lucide-react-native";
import { api } from "@/utils/api";

// const categories = [
//   {
//     id: 1,
//     name: "Men",
//     subcategories: [
//       "T-Shirts",
//       "Shirts",
//       "Jeans",
//       "Trousers",
//       "Suits",
//       "Activewear",
//     ],
//     image:
//       "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=500&auto=format&fit=crop",
//     products: [
//       {
//         id: 1,
//         name: "Casual White T-Shirt",
//         brand: "Roadster",
//         price: 499,
//         discount: "60% OFF",
//         image:
//           "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&auto=format&fit=crop",
//       },
//       {
//         id: 2,
//         name: "Denim Jacket",
//         brand: "Levis",
//         price: 2499,
//         discount: "40% OFF",
//         image:
//           "https://images.unsplash.com/photo-1523205771623-e0faa4d2813d?w=500&auto=format&fit=crop",
//       },
//     ],
//   },
//   {
//     id: 2,
//     name: "Women",
//     subcategories: [
//       "Dresses",
//       "Tops",
//       "Ethnic Wear",
//       "Western Wear",
//       "Activewear",
//     ],
//     image:
//       "https://images.unsplash.com/photo-1618244972963-dbad0c4abf18?w=500&auto=format&fit=crop",
//     products: [
//       {
//         id: 3,
//         name: "Summer Dress",
//         brand: "ONLY",
//         price: 1299,
//         discount: "50% OFF",
//         image:
//           "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=500&auto=format&fit=crop",
//       },
//     ],
//   },
//   {
//     id: 3,
//     name: "Kids",
//     subcategories: [
//       "Boys Clothing",
//       "Girls Clothing",
//       "Infants",
//       "Toys",
//       "School Essentials",
//     ],
//     image:
//       "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=500&auto=format&fit=crop",
//     products: [],
//   },
//   {
//     id: 4,
//     name: "Beauty",
//     subcategories: [
//       "Makeup",
//       "Skincare",
//       "Haircare",
//       "Fragrances",
//       "Personal Care",
//     ],
//     image:
//       "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&auto=format&fit=crop",
//     products: [],
//   },
//   {
//     id: 5,
//     name: "Accessories",
//     subcategories: ["Watches", "Bags", "Jewellery", "Sunglasses", "Belts"],
//     image:
//       "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop",
//     products: [],
//   },
// ];

export default function TabTwoScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setcategories] = useState<any>(null);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryImage, setNewCategoryImage] = useState("");
  const [newCategorySubcategories, setNewCategorySubcategories] = useState("");
  const [categoryMessage, setCategoryMessage] = useState("");
  const [newProductName, setNewProductName] = useState("");
  const [newProductBrand, setNewProductBrand] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("");
  const [newProductDiscount, setNewProductDiscount] = useState("");
  const [newProductDescription, setNewProductDescription] = useState("");
  const [newProductSizes, setNewProductSizes] = useState("");
  const [newProductImages, setNewProductImages] = useState("");
  const [productMessage, setProductMessage] = useState("");
  useEffect(() => {
    const fetchproduct = async () => {
      try {
        setIsLoading(true);
        const cat = await api.get("/category");
        setcategories(cat.data);
      } catch (error) {
        console.log(error);
        setIsLoading(false);
      } finally {
        setIsLoading(false);
      }
    };
    fetchproduct();
  }, []);

  const refreshCategories = async () => {
    try {
      setIsLoading(true);
      const cat = await api.get("/category");
      setcategories(cat.data);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim() || !newCategoryImage.trim()) {
      setCategoryMessage("Name and image are required.");
      return;
    }
    try {
      setCategoryMessage("");
      await api.post("/category", {
        name: newCategoryName,
        image: newCategoryImage,
        subcategory: newCategorySubcategories,
      });
      setNewCategoryName("");
      setNewCategoryImage("");
      setNewCategorySubcategories("");
      setCategoryMessage("Category created successfully.");
      refreshCategories();
      setCreatingCategory(false);
    } catch (error) {
      console.log(error);
      setCategoryMessage("Unable to create category.");
    }
  };

  const handleCreateProduct = async () => {
    if (!selectedCategory || !newProductName.trim() || !newProductBrand.trim() || !newProductPrice.trim() || !newProductImages.trim()) {
      setProductMessage("Product name, brand, price and image are required.");
      return;
    }
    try {
      setProductMessage("");
      await api.post("/product", {
        name: newProductName,
        brand: newProductBrand,
        price: Number(newProductPrice),
        discount: newProductDiscount,
        description: newProductDescription,
        sizes: newProductSizes,
        images: newProductImages.split(",").map((item) => item.trim()),
        categoryId: selectedCategory,
      });
      setNewProductName("");
      setNewProductBrand("");
      setNewProductPrice("");
      setNewProductDiscount("");
      setNewProductDescription("");
      setNewProductSizes("");
      setNewProductImages("");
      setProductMessage("Product created successfully.");
      refreshCategories();
    } catch (error) {
      console.log(error);
      setProductMessage("Unable to create product.");
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#ff3f6c" />
      </View>
    );
  }
  if (!categories) {
    return (
      <View style={styles.container}>
        <Text>Categories not found</Text>
      </View>
    );
  }
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setSelectedCategory(null);
    setSelectedSubcategory(null);
  };
  const clearSearch = () => {
    setSearchQuery("");
    setSelectedCategory(null);
    setSelectedSubcategory(null);
  };
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedSubcategory(null);
    setSearchQuery("");
  };
  const handleSubcategorySelect = (subcategoryId: string) => {
    setSelectedSubcategory(subcategoryId);
    setSearchQuery("");
  };
  const filtercategories = categories?.filter(
    (category: any) =>
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.subcategory.some((subcategory: any) =>
        subcategory.toLowerCase().includes(searchQuery.toLowerCase())
      ) ||
      category.productId.some(
        (product: any) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.brand.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );
  const selectedcategorydata = selectedCategory
    ? categories?.find((cat: any) => cat._id === selectedCategory)
    : null;
  const renderProducts = (products: any) => {
    return products?.map((product: any) => (
      <TouchableOpacity
        key={product._id}
        style={styles.productCard}
        onPress={() => router.push(`/product/${product._id}`)}
      >
        <Image source={{ uri: product.images[0] }} style={styles.productImage} />
        <View style={styles.productInfo}>
          <Text style={styles.brandName}>{product.brand}</Text>
          <Text style={styles.productName}>{product.name}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{product.price}</Text>
            <Text style={styles.discount}>{product.discount}</Text>
          </View>
        </View>
      </TouchableOpacity>
    ));
  };
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Categories</Text>
      </View>

      <View style={styles.createHeader}>
        <TouchableOpacity
          style={styles.createToggle}
          onPress={() => setCreatingCategory(!creatingCategory)}
        >
          <Text style={styles.createToggleText}>
            {creatingCategory ? "Hide" : "Add New Category"}
          </Text>
        </TouchableOpacity>
      </View>
      {creatingCategory ? (
        <View style={styles.createForm}>
          <TextInput
            style={styles.input}
            placeholder="Category Name"
            value={newCategoryName}
            onChangeText={setNewCategoryName}
          />
          <TextInput
            style={styles.input}
            placeholder="Image URL"
            value={newCategoryImage}
            onChangeText={setNewCategoryImage}
          />
          <TextInput
            style={styles.input}
            placeholder="Subcategories (comma separated)"
            value={newCategorySubcategories}
            onChangeText={setNewCategorySubcategories}
          />
          <TouchableOpacity style={styles.primaryButton} onPress={handleCreateCategory}>
            <Text style={styles.primaryButtonText}>CREATE CATEGORY</Text>
          </TouchableOpacity>
          {categoryMessage ? <Text style={styles.formMessage}>{categoryMessage}</Text> : null}
        </View>
      ) : null}

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for products, brands and more"
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery !== "" && (
            <TouchableOpacity onPress={clearSearch}>
              <X size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <ScrollView style={styles.content}>
        {!selectedCategory && (
          <View style={styles.categoriesGrid}>
            {filtercategories?.map((category: any) => (
              <TouchableOpacity
                key={category._id}
                style={styles.categoryCard}
                onPress={() => handleCategorySelect(category._id)}
              >
                <Image
                  source={{ uri: category.image }}
                  style={styles.categoryImage}
                />
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.subcategories}>
                      {category?.subcategory?.map((sub: any, index: any) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.subcategoryTag}
                          onPress={() => handleSubcategorySelect(sub)}
                        >
                          <Text style={styles.subcategoryText}>{sub}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {selectedcategorydata && (
          <View style={styles.categoryDetail}>
            <View style={styles.categoryHeader}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setSelectedCategory(null)}
              >
                <Text style={styles.backButtonText}>← Back to Categories</Text>
              </TouchableOpacity>
              <Text style={styles.categoryTitle}>
                {selectedcategorydata.name}
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.subcategoriesScroll}
            >
              {selectedcategorydata.subcategory.map(
                (sub: any, index: any) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.subcategoryButton,
                      selectedSubcategory === sub && styles.selectedSubcategory,
                    ]}
                    onPress={() => handleSubcategorySelect(sub)}
                  >
                    <Text
                      style={[
                        styles.subcategoryButtonText,
                        selectedSubcategory === sub &&
                          styles.selectedSubcategoryText,
                      ]}
                    >
                      {sub}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </ScrollView>
            <View style={styles.productsGrid}>
              {renderProducts(selectedcategorydata?.productId)}
            </View>

            <View style={styles.createForm}>
              <Text style={styles.sectionTitle}>Add Product to {selectedcategorydata.name}</Text>
              <TextInput
                style={styles.input}
                placeholder="Product Name"
                value={newProductName}
                onChangeText={setNewProductName}
              />
              <TextInput
                style={styles.input}
                placeholder="Brand"
                value={newProductBrand}
                onChangeText={setNewProductBrand}
              />
              <TextInput
                style={styles.input}
                placeholder="Price"
                keyboardType="numeric"
                value={newProductPrice}
                onChangeText={setNewProductPrice}
              />
              <TextInput
                style={styles.input}
                placeholder="Discount (e.g. 50% OFF)"
                value={newProductDiscount}
                onChangeText={setNewProductDiscount}
              />
              <TextInput
                style={styles.input}
                placeholder="Description"
                value={newProductDescription}
                onChangeText={setNewProductDescription}
              />
              <TextInput
                style={styles.input}
                placeholder="Sizes (comma separated)"
                value={newProductSizes}
                onChangeText={setNewProductSizes}
              />
              <TextInput
                style={styles.input}
                placeholder="Image URLs (comma separated)"
                value={newProductImages}
                onChangeText={setNewProductImages}
              />
              <TouchableOpacity style={styles.primaryButton} onPress={handleCreateProduct}>
                <Text style={styles.primaryButtonText}>CREATE PRODUCT</Text>
              </TouchableOpacity>
              {productMessage ? <Text style={styles.formMessage}>{productMessage}</Text> : null}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    padding: 15,
    paddingTop: 50,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#3e3e3e",
  },
  searchContainer: {
    padding: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    padding: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#3e3e3e",
  },
  content: {
    flex: 1,
  },
  categoriesGrid: {
    padding: 15,
  },
  categoryCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: "hidden",
  },
  categoryImage: {
    width: "100%",
    height: 150,
  },
  categoryInfo: {
    padding: 15,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#3e3e3e",
    marginBottom: 10,
  },
  createHeader: {
    padding: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  createToggle: {
    backgroundColor: "#ff3f6c",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  createToggleText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  createForm: {
    padding: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  input: {
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: "#3e3e3e",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  formMessage: {
    marginTop: 10,
    color: "#3e3e3e",
    fontSize: 14,
  },
  subcategories: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  subcategoryTag: {
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
  },
  subcategoryText: {
    fontSize: 14,
    color: "#666",
  },
  categoryDetail: {
    flex: 1,
    padding: 15,
  },
  categoryHeader: {
    marginBottom: 15,
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    color: "#ff3f6c",
    fontSize: 16,
  },
  categoryTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#3e3e3e",
  },
  subcategoriesScroll: {
    marginBottom: 15,
  },
  subcategoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    marginRight: 10,
  },
  selectedSubcategory: {
    backgroundColor: "#ff3f6c",
  },
  subcategoryButtonText: {
    fontSize: 14,
    color: "#3e3e3e",
  },
  selectedSubcategoryText: {
    color: "#fff",
  },
  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  productCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: "hidden",
  },
  productImage: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
  },
  productInfo: {
    padding: 10,
  },
  brandName: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  productName: {
    fontSize: 16,
    color: "#3e3e3e",
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  price: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#3e3e3e",
    marginRight: 8,
  },
  discount: {
    fontSize: 14,
    color: "#ff3f6c",
  },
});
