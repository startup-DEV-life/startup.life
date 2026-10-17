using UnityEngine;

namespace StartupLife
{
    public sealed class StartupLifeHud : MonoBehaviour
    {
        private GUIStyle titleStyle;
        private GUIStyle bodyStyle;

        private void OnGUI()
        {
            titleStyle ??= new GUIStyle(GUI.skin.label) { fontSize = 25, fontStyle = FontStyle.Bold, normal = { textColor = Color.white } };
            bodyStyle ??= new GUIStyle(GUI.skin.label) { fontSize = 14, normal = { textColor = new Color(0.86f, 0.92f, 1f) } };
            GUI.Label(new Rect(28, 22, 420, 34), "STARTUP.LIFE  •  DEV DISTRICT", titleStyle);
            GUI.Label(new Rect(30, 60, 520, 22), "Explore the city  ·  Meet builders  ·  Build your future", bodyStyle);
            GUI.Label(new Rect(30, Screen.height - 48, 720, 24), "WASD / arrow keys to move   •   mouse to orbit   •   space to jump", bodyStyle);
        }
    }
}
