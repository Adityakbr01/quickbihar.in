import React from 'react'
import {
    StyleSheet,
    View,
    useWindowDimensions,
} from 'react-native'
import Carousel from 'react-native-reanimated-carousel'
import {
    useSharedValue,
} from 'react-native-reanimated'
import { carouselData } from '../lib/data'
import CarouselSlide from './carousel/CarouselSlide'
import DashIndicator from './carousel/DashIndicator'

const MAX_WIDTH = 800

const TopHomeCarousel = () => {
    const { width: windowWidth } = useWindowDimensions()
    const progressValue = useSharedValue(0)

    // Calculate responsive width and height
    const carouselWidth = Math.min(windowWidth, MAX_WIDTH)
    const isSmallScreen = windowWidth < 600
    // On small screens, keep 180 height. On larger, use a ~2:1 aspect ratio
    const carouselHeight = isSmallScreen ? 180 : carouselWidth * 0.48

    return (
        <View style={[styles.container, { width: windowWidth }]}>
            <View style={{ width: carouselWidth }}>
                <Carousel
                    width={carouselWidth}
                    height={carouselHeight}
                    data={carouselData}
                    autoPlay
                    loop
                    autoPlayInterval={3500}
                    mode="parallax"
                    modeConfig={{
                        parallaxScrollingScale: isSmallScreen ? 0.94 : 0.98,
                        parallaxScrollingOffset: isSmallScreen ? 25 : 10,
                    }}
                    onProgressChange={(_, absoluteProgress) => {
                        progressValue.value = absoluteProgress
                    }}
                    renderItem={({ item, index }) => (
                        <CarouselSlide
                            item={item}
                            index={index}
                        />
                    )}
                />

                {/* ── Flipkart-style dash indicators ── */}
                <View style={styles.pagination}>
                    {carouselData.map((_, i) => (
                        <DashIndicator
                            key={i}
                            index={i}
                            progressValue={progressValue}
                            dataLength={carouselData.length}
                        />
                    ))}
                </View>
            </View>
        </View>
    )
}

export default TopHomeCarousel

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
    },
    pagination: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        marginTop: 10,
    },
})