import { ImageSourcePropType } from "react-native";

export interface CarouselItem {
    id: string;
    image: string | ImageSourcePropType;
    link: string;
}

export interface CategoryItem {
    id: string;
    title: string;
    image?: string | ImageSourcePropType;
}

export const carouselData: CarouselItem[] = [
    { id: '1', image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800', link: '/?offer=trends' },
    { id: '2', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800', link: '/?offer=kurtis' },
    { id: '3', image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800', link: '/?offer=sarees' },
];

export const categoriesData: CategoryItem[] = [
    { id: '1', title: 'Trends' },
    { id: '2', title: 'Kurtis' },
    { id: '3', title: 'Sarees' },
    { id: '4', title: 'Kurta Set' },
    { id: '5', title: 'Weddings' },
    { id: '6', title: 'Jeans' },
    { id: '7', title: 'Men' },
];
