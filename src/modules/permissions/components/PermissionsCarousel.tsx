import { Animated, Easing, useWindowDimensions, View } from 'react-native';
import { useEffect, useMemo, useState } from 'react';

import {
  Button,
  Icon,
  FontAwesomeIconName,
  MainText,
  useThemedStyles,
  createThemeStyleSheet,
  MainModal,
  ModalProvider,
} from '@rapid-recovery-agency-inc/sloth-ui-mobile';

export interface PermissionRequest {
  title?: string;
  description: string;
  iconName?: FontAwesomeIconName;
  onAccept: () => Promise<void>;
  onReject: () => Promise<void>;
}

export interface PermissionsCarouselProps {
  isVisible: boolean;
  requests: PermissionRequest[];
  acceptButtonText?: string;
  rejectButtonText?: string;
}

export const PermissionsCarousel = ({
  requests,
  acceptButtonText,
  rejectButtonText,
  isVisible,
}: PermissionsCarouselProps) => {
  const styles = useThemedStyles(responsiveStyles);
  const { width } = useWindowDimensions();

  const [slideIndex, setSlideIndex] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [translateX] = useState(() => new Animated.Value(0));
  const currentRequest = useMemo(() => requests[slideIndex], [requests, slideIndex]);
  const [pending, setPending] = useState<boolean>(false);

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    translateX.stopAnimation();
    translateX.setValue(-slideIndex * width);
  }, [width, slideIndex, isVisible, translateX]);

  const goToNextSlide = () => {
    if (isAnimating || slideIndex >= requests.length - 1) {
      return;
    }

    const nextSlideIndex = slideIndex + 1;
    setIsAnimating(true);

    Animated.timing(translateX, {
      toValue: -nextSlideIndex * width,
      duration: 220,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      setSlideIndex(nextSlideIndex);
      setIsAnimating(false);
    });
  };

  const handleAccept = async () => {
    if (!currentRequest || isAnimating) {
      return;
    }

    setPending(true);
    await currentRequest.onAccept();
    goToNextSlide();
    setPending(false);
  };

  const handleReject = async () => {
    if (!currentRequest || isAnimating) {
      return;
    }

    setPending(true);
    await currentRequest.onReject();
    goToNextSlide();
    setPending(false);
  };

  return (
    <ModalProvider>
      <MainModal mode="full" isVisible={isVisible} maxHeightRatio={1} includeKeyboardController={false}>
        <View style={styles.modalContent}>
          <View style={styles.carouselViewport}>
            <Animated.View
              style={[
                styles.carouselTrack,
                {
                  width: width * requests.length,
                  transform: [{ translateX }],
                },
              ]}
            >
              {requests?.map(({ title, description, iconName }, index) => (
                <View style={[styles.slide, { width }]} key={`${description}-${index}`}>
                  <View style={styles.main}>
                    {iconName ? (
                      <View style={styles.iconOuterCircle}>
                        <View style={styles.iconInnerCircle}>
                          <Icon iconName={iconName} themeColor="fgAlwaysWhite" size={48} />
                        </View>
                      </View>
                    ) : undefined}
                    <View style={styles.textContainer}>
                      <MainText size={20} weight="black" textAlign="center">
                        {title ?? 'Permission Needed'}
                      </MainText>
                      <MainText size={14} weight="book" themeColor="fgSecondary" textAlign="center">
                        {description}
                      </MainText>
                    </View>
                    <View style={styles.paginationContainer}>
                      {requests?.map((_, index) => (
                        <View
                          key={index}
                          style={[styles.paginationDot, index === slideIndex ? styles.paginationDotActive : {}]}
                        />
                      ))}
                    </View>
                  </View>
                </View>
              ))}
            </Animated.View>
          </View>
          {currentRequest ? (
            <View style={styles.footer}>
              <Button
                text={acceptButtonText || 'Okay'}
                fullWidth={false}
                onPress={handleAccept}
                disabled={isAnimating || pending}
              />
              <Button
                text={rejectButtonText || 'Skip'}
                variant="transparent"
                onPress={handleReject}
                disabled={isAnimating || pending}
              />
            </View>
          ) : null}
        </View>
      </MainModal>
    </ModalProvider>
  );
};

const responsiveStyles = createThemeStyleSheet({
  modalContent: {
    flex: 1,
    height: '100%',
    width: '100%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  carouselViewport: {
    flex: 1,
    overflow: 'hidden',
  },
  carouselTrack: {
    flex: 1,
    flexDirection: 'row',
  },
  slide: {
    flex: 1,
  },
  main: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  footer: {
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  iconOuterCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 136,
    height: 136,
    borderRadius: 68,
    backgroundColor: 'bgBrandSoft',
    shadowColor: 'fgAlwaysBlack',
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 1,
  },
  iconInnerCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: 'fgBrandContrast',
  },
  textContainer: {
    marginHorizontal: 56,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  paginationContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  paginationDot: {
    width: 24,
    height: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'borderColor',
    backgroundColor: 'fgAlwaysBlack',
    opacity: 0.2,
  },
  paginationDotActive: {
    opacity: 1,
  },
});
