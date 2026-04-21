/**
 * Permission: An enum representing the different types of permissions that the app may request from the
 * user. This is used to standardize permission handling across the app and ensure consistency in how
 * permissions are referenced and managed.
 */
export enum Permission {
  TRACKING = 'tracking',
  LOCATION = 'location',
  CAMERA = 'camera',
  PUSH_NOTIFICATIONS = 'pushNotifications',
}

/**
 * PermissionState: An enum representing the possible states of a permission (granted, denied, blocked).
 */
export enum PermissionState {
  GRANTED = 'granted',
  DENIED = 'denied',
  BLOCKED = 'blocked',
}

/**
 * LocationPermissionGrantLevel: An enum representing the different levels of location permission that
 * can be granted to the app. This is used to determine the appropriate UI and messaging to show to the
 * user based on their location permission status, and to handle location permission requests accordingly.
 */
export enum LocationPermissionGrantLevel {
  NONE = 'none',
  WHILE_IN_USE = 'while_in_use',
  ALWAYS = 'always',
}

export interface PermissionConfig {
  /**
   * Title: A user-friendly name for the permission, used in UI and messaging to clearly communicate to
   * the user what the permission is for. This should be concise enough to convey the purpose of the permission.
   */
  title: string;

  /**
   * Description: A more detailed explanation of why the permission is needed and how it will be used.
   * This is used to provide additional context to the user, helping them understand the value of granting
   * the permission and how it will enhance their experience with the app.
   */
  description: string;

  /**
   * IconName: The name of the icon to represent the permission in the UI. This is used to provide a visual
   * cue to the user about the type of permission being requested, helping to make the permission prompt more
   * engaging and easier to understand at a glance.
   * Note: The value must be a valid FontAwesomeIconName supported by the Sloth UI Mobile library.
   */
  iconName: string;

  /**
   * Warning Text: Contains the title and messages to be displayed when the user has denied or blocked the permission.
   */
  warningTitle: string;
  warningMessage1: string;
  warningMessage2: string;

  /**
   * Required: Indicates whether this permission is required for the app to function properly. Required
   * permissions will trigger additional warnings if denied, while optional permissions will
   * be treated as nice-to-have features that can be skipped without impacting core functionality.
   */
  required: boolean;

  /**
   * Prompt: Indicates whether the app should prompt the user for this permission. This is used to control
   * whether the permission prompt should be shown to the user, allowing for permissions to be
   * requested in a more contextual manner within the app rather than all at once on initial load.
   */
  prompt: boolean;

  /**
   * Requested: Indicates whether the user has been shown the native permission request. This is used to
   * determine whether the permission request can be shown again.
   */
  requested: boolean;

  /**
   * Skipped: Indicates whether the user has skipped the permission prompt. This is used to determine
   * whether to show the permission prompt again.
   */
  skipped: boolean;

  /**
   * PermissionState: Represents the current state of the permission (granted, denied, blocked). This is
   * used to determine the appropriate UI and messaging to show to the user based on their permission status,
   * and to handle permission requests accordingly.
   * Note: This can be null if the permission has never been requested before, allowing us to differentiate
   * between permissions that have never been requested (null) vs those that have been requested and denied.
   */
  permissionState: PermissionState | null;

  /**
   * LocationGrantLevel: Represents the current level of location permission granted (none, while in use, always).
   * This is used to determine the appropriate UI and messaging to show to the user based on their location
   * permission status, and to handle location permission requests accordingly.
   * */
  locationGrantLevel?: LocationPermissionGrantLevel;

  /**
   * OS: Represents the operating system(s) that this permission applies to. This is used to conditionally show
   * permission prompts and handle permission requests based on the user's device, ensuring that users are only
   * prompted for permissions that are relevant to their platform. The value can be a specific OS ('iOS' or 'android')
   * or '*' to indicate that the permission applies to all platforms.
   */
  os: '*' | 'ios' | 'android';
}

/**
 * Permissions: An object representing the different permissions that the app may request from the user,
 * along with their associated configuration and state. This is used to manage the permissions in a centralized
 * manner, allowing for easy access and updates to permission information across the app. Each key in the
 * Permissions object corresponds to a specific permission type defined in the Permission enum, and the value
 * is a PermissionConfig object that contains the details and state of that permission.
 */
export interface Permissions {
  location: PermissionConfig;
  camera: PermissionConfig;
  pushNotifications: PermissionConfig;
  tracking: PermissionConfig;
}

export type PartialPermissions = {
  [K in keyof Permissions]?: Permissions[K];
};

/**
 * WarningButtonPosition: A restricted style type for positioning the PermissionsWarning button.
 * Only layout/position properties are accepted — appearance cannot be overridden.
 */
export type WarningButtonPosition = {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
  width?: number;
  height?: number;
};
