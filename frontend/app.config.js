export default ({ config }) => {
  return {
    ...config,
    name: "frontend",
    slug: "frontend",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: true
        }
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      usesCleartextTraffic: true
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      apiOrigin: "http://192.168.0.160:8080", // << 여기에 각자 아이피 넣은 후에 실행 해보세요
      //이부분 아이피는 제 아이피로 설정되어있으니 참고 바랍니다.

      eas: {
        projectId: "replace-with-your-project-id-if-using-eas"
      }
    }
  };
};
