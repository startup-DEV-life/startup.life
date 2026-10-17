using UnityEngine;

namespace StartupLife
{
    [RequireComponent(typeof(CharacterController))]
    public sealed class ThirdPersonController : MonoBehaviour
    {
        [SerializeField] private float moveSpeed = 7f;
        [SerializeField] private float gravity = -24f;

        private CharacterController characterController;
        private float verticalVelocity;

        private void Awake() => characterController = GetComponent<CharacterController>();

        private void Update()
        {
            var input = new Vector2(Input.GetAxisRaw("Horizontal"), Input.GetAxisRaw("Vertical"));
            if (input.sqrMagnitude > 1f) input.Normalize();

            var cameraTransform = Camera.main.transform;
            var forward = Vector3.ProjectOnPlane(cameraTransform.forward, Vector3.up).normalized;
            var right = Vector3.ProjectOnPlane(cameraTransform.right, Vector3.up).normalized;
            var direction = forward * input.y + right * input.x;

            if (direction.sqrMagnitude > 0.001f)
            {
                transform.rotation = Quaternion.Slerp(transform.rotation, Quaternion.LookRotation(direction), 14f * Time.deltaTime);
            }

            if (characterController.isGrounded && verticalVelocity < 0f) verticalVelocity = -2f;
            if (characterController.isGrounded && Input.GetButtonDown("Jump")) verticalVelocity = 8.5f;
            verticalVelocity += gravity * Time.deltaTime;
            characterController.Move((direction * moveSpeed + Vector3.up * verticalVelocity) * Time.deltaTime);
        }
    }

    public sealed class ThirdPersonCamera : MonoBehaviour
    {
        private Transform target;
        private float yaw = 26f;
        private float pitch = 22f;
        private const float Distance = 9f;

        public void Initialize(Transform player) => target = player;

        private void LateUpdate()
        {
            if (target == null) return;
            yaw += Input.GetAxis("Mouse X") * 150f * Time.deltaTime;
            pitch = Mathf.Clamp(pitch - Input.GetAxis("Mouse Y") * 110f * Time.deltaTime, 8f, 58f);
            var rotation = Quaternion.Euler(pitch, yaw, 0f);
            transform.SetPositionAndRotation(target.position - rotation * Vector3.forward * Distance + Vector3.up * 1.5f, rotation);
        }
    }
}
