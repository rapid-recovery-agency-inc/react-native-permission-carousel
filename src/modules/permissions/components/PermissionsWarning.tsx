import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { openSettings } from 'react-native-permissions';
import { MainModal, MainText, Icon, useThemeColor } from '@rapid-recovery-agency-inc/sloth-ui-mobile';

import { Permission, Permissions, WarningButtonPosition } from '../types';
import { t } from '../../../shared/i18n';

export interface PermissionsWarningProps {
  missingPermissions: Partial<Permissions>;
  onRequestPermission: (permission: Permission) => Promise<void>;
  buttonPosition?: WarningButtonPosition;
}

export function PermissionsWarning({
  missingPermissions,
  onRequestPermission,
  buttonPosition,
}: PermissionsWarningProps): React.JSX.Element {
  const [showModal, setModal] = useState(false);

  const warningColor = useThemeColor('uiWarningSolid');

  if (showModal) {
    return (
      <MainModal
        isVisible={true}
        mode="full"
        title={t('permissions:missing.intro.title')}
        safeAreaInsets={{ top: 56, right: 24, bottom: 0, left: 24 }}
        onClose={() => {
          setModal(false);
        }}
      >
        <View style={styles.container}>
          <MainText size={14} weight="book">
            {t('permissions:missing.intro.message1')}
          </MainText>
          <MainText size={14} weight="book">
            {t('permissions:missing.intro.message2')}
          </MainText>
          <MainText size={14} weight="book">
            {t('permissions:missing.intro.message3')}
          </MainText>
          {Object.entries(missingPermissions)?.map(([key, missingPermission]) => (
            <View key={key} style={styles.content}>
              <MainText size={14} weight="bold">
                {missingPermission.warningTitle}
              </MainText>
              <MainText size={14} weight="book">
                {missingPermission.warningMessage1}
              </MainText>
              {missingPermission.warningMessage2 !== undefined ? (
                <MainText size={14} weight="book">
                  {missingPermission.warningMessage2}
                </MainText>
              ) : undefined}
              {missingPermission.requested ? (
                <TouchableOpacity
                  hitSlop={20}
                  onPress={async () => {
                    await openSettings('application');
                  }}
                >
                  <MainText size={14} weight="book" themeColor="uiBrandSolid">
                    {t(`permissions:missing.actions.openSettings`)}
                  </MainText>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  hitSlop={20}
                  onPress={async () => {
                    await onRequestPermission(key as Permission);
                  }}
                >
                  <MainText size={14} weight="book" themeColor="uiBrandSolid">
                    {t(`permissions:missing.actions.request`)}
                  </MainText>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      </MainModal>
    );
  }

  if (Object.keys(missingPermissions)?.length > 0) {
    return (
      <TouchableOpacity
        testID="permissions-warning-button"
        onPress={() => {
          setModal(true);
        }}
        style={[styles.button, buttonPosition]}
      >
        <View style={[styles.icon, { backgroundColor: warningColor }]}>
          <Icon iconName="exclamation" themeColor="fgAlwaysWhite" size={20} />
        </View>
      </TouchableOpacity>
    );
  }

  return <View />;
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    top: 64,
    right: 64,
    width: 40,
    height: 40,
  },
  icon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 50,
    shadowColor: 'fgBrandContrast',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: {
      width: 1,
      height: 1,
    },
  },
  container: {
    padding: 16,
    gap: 16,
  },
  content: {
    paddingTop: 16,
    gap: 16,
    borderTopWidth: 1,
    borderColor: 'bgAlwaysGray',
  },
});
