import { ImageSourcePropType } from "react-native";

export interface CarouselItem {
    id: string;
    image: ImageSourcePropType;
    link: string;
}

export interface CategoryItem {
    id: string;
    title: string;
    image: ImageSourcePropType;
}

export const carouselData: CarouselItem[] = [
    { id: '1', image: require('@/assets/images/bn1.webp'), link: '/?offer=trends' },
    { id: '2', image: require('@/assets/images/bn2.webp'), link: '/?offer=kurtis' },
    { id: '3', image: require('@/assets/images/bn3.webp'), link: '/?offer=sarees' },
    { id: '4', image: require('@/assets/images/bn4.webp'), link: '/?offer=weddings' },
    { id: '5', image: require('@/assets/images/bn5.webp'), link: '/?offer=jeans' },
    { id: '6', image: require('@/assets/images/bn6.webp'), link: '/?offer=menswear' },
];

export const categoriesData: CategoryItem[] = [
    { id: '1', title: 'Trends', image: require('@/assets/images/treands.jpg') },
    { id: '2', title: 'Kurtis', image: require('@/assets/images/kurtis.jpg') },
    { id: '3', title: 'Sarees', image: require('@/assets/images/sarees.jpg') },
    { id: '4', title: 'Kurta Set', image: require('@/assets/images/kurtaSetGirl.jpg') },
    { id: '5', title: 'Weddings', image: require('@/assets/images/weddings.jpg') },
    { id: '6', title: 'Jeans', image: require('@/assets/images/jeans.jpg') },
    { id: '7', title: 'Men', image: require('@/assets/images/shirt&Tshirt.jpg') },
];
