/**
 * react-native-reanimated stub
 * Used for local Android builds on Windows where the C++ compilation fails.
 * NativeWind/react-native-css-interop requires reanimated for CSS animations,
 * but our app only uses basic Tailwind classes so this stub is safe.
 */

const noop = () => {};
const identity = (v) => v;

// Shared values
const makeMutable = (value) => ({
  value,
  modify: noop,
  addListener: noop,
  removeListener: noop,
  _isReanimatedSharedValue: true,
});

// Animation builders - return the value unchanged  
const withTiming = (value) => value;
const withSpring = (value) => value;
const withDelay = (_, animation) => animation;
const withRepeat = (animation) => animation;
const withSequence = (...animations) => animations[animations.length - 1];
const withDecay = () => 0;

// Hooks - return stable no-op values
const useSharedValue = (init) => makeMutable(init);
const useDerivedValue = (fn) => makeMutable(fn());
const useAnimatedStyle = () => ({});
const useAnimatedProps = () => ({});
const useAnimatedScrollHandler = () => ({});
const useAnimatedGestureHandler = () => ({});
const useAnimatedRef = () => ({ current: null });
const useAnimatedReaction = noop;
const useWorkletCallback = (fn) => fn;

// Easing
const Easing = {
  linear: identity,
  ease: identity,
  quad: identity,
  cubic: identity,
  poly: () => identity,
  sin: identity,
  circle: identity,
  exp: identity,
  elastic: () => identity,
  back: () => identity,
  bounce: identity,
  bezier: () => identity,
  bezierFn: () => identity,
  in: identity,
  out: identity,
  inOut: identity,
};

// Animated component wrapper - just return the component as-is
const createAnimatedComponent = (Component) => Component;
const Animated = {
  View: require('react-native').View,
  Text: require('react-native').Text,
  Image: require('react-native').Image,
  ScrollView: require('react-native').ScrollView,
  FlatList: require('react-native').FlatList,
  createAnimatedComponent,
};

// Keyframe stub
class Keyframe {
  constructor() {}
  duration() { return this; }
  delay() { return this; }
  reduceMotion() { return this; }
  withCallback() { return this; }
}

// Layout animations
const FadeIn = new Keyframe();
const FadeOut = new Keyframe();
const FadeInUp = new Keyframe();
const FadeInDown = new Keyframe();
const SlideInLeft = new Keyframe();
const SlideInRight = new Keyframe();
const SlideOutLeft = new Keyframe();
const SlideOutRight = new Keyframe();
const ZoomIn = new Keyframe();
const ZoomOut = new Keyframe();
const LinearTransition = new Keyframe();

// runOnJS / runOnUI
const runOnJS = (fn) => fn;
const runOnUI = (fn) => fn;
const cancelAnimation = noop;
const interpolate = (value) => value;
const interpolateColor = (value) => value;
const measure = () => null;
const scrollTo = noop;

module.exports = {
  default: Animated,
  Animated,
  Easing,
  Keyframe,
  makeMutable,
  makeShareableCloneRecursive: identity,
  withTiming,
  withSpring,
  withDelay,
  withRepeat,
  withSequence,
  withDecay,
  useSharedValue,
  useDerivedValue,
  useAnimatedStyle,
  useAnimatedProps,
  useAnimatedScrollHandler,
  useAnimatedGestureHandler,
  useAnimatedRef,
  useAnimatedReaction,
  useWorkletCallback,
  createAnimatedComponent,
  runOnJS,
  runOnUI,
  cancelAnimation,
  interpolate,
  interpolateColor,
  measure,
  scrollTo,
  FadeIn, FadeOut, FadeInUp, FadeInDown,
  SlideInLeft, SlideInRight, SlideOutLeft, SlideOutRight,
  ZoomIn, ZoomOut, LinearTransition,
};
