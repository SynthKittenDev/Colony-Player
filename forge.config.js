module.exports = {
  packagerConfig: {
    icon: "src/icons/icon",
    asar: {
      unpackDir: 'plugins'
    },
    executableName: "colony-revived",
    arch: "x64",
    extraResource: [
      "./src/plugins",
      "./src/icons",
      "./src/ColonyV63.swf"
    ]        
  },
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        "name": "colony-revived",
        "authors": "Your Name",
        "setupIcon": "src/icons/icon.ico"
      }
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: [
        "darwin"
      ]
    },
    {
      name: "@electron-forge/maker-deb",
      config: {
        options: {
          icon: "src/icons/icon.png",
          maintainer: "Your Name",
          homepage: "https://yourwebsite.com",
          categories: ["Game"],
          arch: "amd64"
        }
      }
    }
  ],
};
