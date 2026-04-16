import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { openSettings } from 'react-native-permissions';
import { MainModal, MainText, Icon } from '@rapid-recovery-agency-inc/sloth-ui-mobile';

import { Permission, Permissions } from '../types';
import { t } from '../../../shared/i18n';

export interface PermissionsWarningProps {
  missingPermissions: Partial<Permissions>;
  onRequestPermission: (permission: Permission) => Promise<void>;
}

export function PermissionsWarning({
  missingPermissions,
  onRequestPermission,
}: PermissionsWarningProps): React.JSX.Element {
  const [showModal, setModal] = useState(false);

  if (showModal) {
    return (
      <MainModal
        isVisible={true}
        mode="full"
        title={t('permissions.missing.intro.title')}
        safeAreaInsets={{ top: 56, right: 24, bottom: 0, left: 24 }}
        onClose={() => {
          setModal(false);
        }}
      >
        <View style={styles.container}>
          <MainText type="BOOK_SM">{t('permissions.missing.intro.message1')}</MainText>
          <MainText type="BOOK_SM">{t('permissions.missing.intro.message2')}</MainText>
          <MainText type="BOOK_SM">{t('permissions.missing.intro.message3')}</MainText>
          {Object.entries(missingPermissions)?.map(([key, missingPermission]) => (
            <View key={key} style={styles.content}>
              <MainText type="BOLD_SM">{missingPermission.warningTitle}</MainText>
              <MainText type="BOOK_SM">{missingPermission.warningMessage1}</MainText>
              {missingPermission.warningMessage2 !== undefined ? (
                <MainText type="BOOK_SM">{missingPermission.warningMessage2}</MainText>
              ) : undefined}
              {missingPermission.requested ? (
                <TouchableOpacity
                  hitSlop={20}
                  onPress={async () => {
                    await openSettings('application');
                  }}
                >
                  <MainText type="BOOK_SM" themeColor="uiBrandSolid">
                    {t(`permissions.missing.actions.openSettings`)}
                  </MainText>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  hitSlop={20}
                  onPress={async () => {
                    await onRequestPermission(key as Permission);
                  }}
                >
                  <MainText type="BOOK_SM" themeColor="uiBrandSolid">
                    {t(`permissions.missing.actions.request`)}
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
        onPress={() => {
          setModal(true);
        }}
        style={styles.button}
      >
        <View style={styles.icon}>
          <Icon iconName="exclamation" color="WHITE" size={20} />
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
    backgroundColor: 'fgWarningContrast',
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
