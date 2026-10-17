using UnityEngine;

namespace StartupLife
{
    /// <summary>Creates the first playable Dev District slice at runtime.</summary>
    public static class StartupLifeBootstrap
    {
        private static readonly Color Night = new Color(0.035f, 0.055f, 0.11f);
        private static readonly Color Road = new Color(0.075f, 0.09f, 0.12f);
        private static readonly Color[] BuildingColors =
        {
            new Color(0.12f, 0.42f, 0.5f), new Color(0.15f, 0.22f, 0.38f),
            new Color(0.33f, 0.16f, 0.36f), new Color(0.72f, 0.29f, 0.22f)
        };

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        private static void CreateWorld()
        {
            if (Object.FindObjectOfType<ThirdPersonController>() != null) return;

            ClearTemplateScene();
            Application.targetFrameRate = 60;
            RenderSettings.ambientMode = UnityEngine.Rendering.AmbientMode.Flat;
            RenderSettings.ambientLight = new Color(0.24f, 0.31f, 0.45f);
            RenderSettings.fog = true;
            RenderSettings.fogColor = Night;
            RenderSettings.fogDensity = 0.006f;

            CreateLight();
            CreateGround();
            CreateRoadGrid();
            CreateDistrict();
            CreatePlayer();
            CreateHud();
        }

        private static void ClearTemplateScene()
        {
            foreach (var existingCamera in Object.FindObjectsOfType<Camera>())
            {
                existingCamera.enabled = false;
                Object.Destroy(existingCamera.gameObject);
            }

            foreach (var existingLight in Object.FindObjectsOfType<Light>())
            {
                Object.Destroy(existingLight.gameObject);
            }
        }

        private static void CreateLight()
        {
            var sun = new GameObject("Lagos Sun").AddComponent<Light>();
            sun.type = LightType.Directional;
            sun.color = new Color(1f, 0.72f, 0.48f);
            sun.intensity = 1.1f;
            sun.transform.rotation = Quaternion.Euler(48f, -32f, 0f);
        }

        private static void CreateGround()
        {
            CreatePrimitive("Island", PrimitiveType.Plane, Vector3.zero, new Vector3(8f, 1f, 8f), new Color(0.075f, 0.18f, 0.14f));
            CreatePrimitive("Water", PrimitiveType.Plane, new Vector3(0f, -0.06f, 0f), new Vector3(20f, 1f, 20f), new Color(0.02f, 0.18f, 0.29f));
        }

        private static void CreateRoadGrid()
        {
            for (var i = -2; i <= 2; i++)
            {
                CreatePrimitive("Avenue", PrimitiveType.Cube, new Vector3(i * 13f, 0.02f, 0f), new Vector3(4f, 0.08f, 70f), Road);
                CreatePrimitive("Street", PrimitiveType.Cube, new Vector3(0f, 0.03f, i * 13f), new Vector3(70f, 0.08f, 4f), Road);
            }
        }

        private static void CreateDistrict()
        {
            var index = 0;
            for (var x = -2; x <= 2; x++)
            for (var z = -2; z <= 2; z++)
            {
                if (x == 0 && z == 0) continue;
                var height = 5f + ((x * x + z * z + 3) % 4) * 3f;
                var building = CreatePrimitive("Studio " + (index + 1), PrimitiveType.Cube,
                    new Vector3(x * 13f + 4f, height / 2f, z * 13f + 4f), new Vector3(7f, height, 7f), BuildingColors[index % BuildingColors.Length]);
                index++;
            }

            var hub = CreatePrimitive("Startup Life Hub", PrimitiveType.Cylinder, new Vector3(0f, 3f, 0f), new Vector3(8f, 6f, 8f), new Color(0.98f, 0.53f, 0.14f));
            hub.AddComponent<RotatingLandmark>();
        }

        private static void CreatePlayer()
        {
            var player = new GameObject("Player");
            player.transform.position = new Vector3(0f, 1f, -11f);
            var controller = player.AddComponent<CharacterController>();
            controller.height = 1.8f;
            controller.radius = 0.36f;
            controller.center = new Vector3(0f, 0.9f, 0f);
            player.AddComponent<ThirdPersonController>();

            var body = CreatePrimitive("Avatar", PrimitiveType.Capsule, Vector3.up * 0.9f, Vector3.one, new Color(0.94f, 0.68f, 0.4f));
            body.transform.SetParent(player.transform, false);
            Object.Destroy(body.GetComponent<Collider>());

            var cameraObject = new GameObject("Player Camera");
            cameraObject.tag = "MainCamera";
            cameraObject.AddComponent<Camera>();
            cameraObject.AddComponent<AudioListener>();
            var follow = cameraObject.AddComponent<ThirdPersonCamera>();
            follow.Initialize(player.transform);
        }

        private static void CreateHud()
        {
            var hud = new GameObject("Startup Life HUD");
            hud.AddComponent<StartupLifeHud>();
        }

        private static GameObject CreatePrimitive(string objectName, PrimitiveType type, Vector3 position, Vector3 scale, Color color)
        {
            var gameObject = GameObject.CreatePrimitive(type);
            gameObject.name = objectName;
            gameObject.transform.position = position;
            gameObject.transform.localScale = scale;
            var renderer = gameObject.GetComponent<Renderer>();
            renderer.material.color = color;
            return gameObject;
        }
    }

    public sealed class RotatingLandmark : MonoBehaviour
    {
        private void Update() => transform.Rotate(0f, 12f * Time.deltaTime, 0f, Space.World);
    }
}
