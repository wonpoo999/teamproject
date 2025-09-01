export default ({ config }) => {
  const teamHosts = {
    me: "http://10.94.9.1:8080",           // 네 PC
    member1: "http://192.168.138.43:8080", // 팀원1
    // 필요하면 계속 추가
  };

  const target = process.env.TEAM_TARGET || "me";

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
      apiOrigin: teamHosts[target],
      eas: {
        projectId: "replace-with-your-project-id-if-using-eas"
      }
    }
  };
};
