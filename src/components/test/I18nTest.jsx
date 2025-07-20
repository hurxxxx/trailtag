import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography, Paper, Button } from '@mui/material';
import LanguageSwitcher from '../common/LanguageSwitcher';

const I18nTest = () => {
  const { t, i18n } = useTranslation();

  const testKeys = [
    'TrailTag',
    'Learning Program Participation Tracking System',
    'Hello, {{name}}! 👋',
    'Welcome to the TrailTag Admin Dashboard.',
    'Name',
    'Email',
    'Phone Number',
    'Timezone',
    'Language',
    'Korean',
    'English',
    'Japanese',
    'Login',
    'Sign Up',
    'Password',
    'Save',
    'Cancel',
    'Edit',
    'Delete',
    'Confirm',
    'Close',
    'Loading...',
    'An error occurred.',
    'Successfully saved.',
    'Seoul (UTC+9)'
  ];

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          {t('i18n Test')}
        </Typography>
        <LanguageSwitcher />
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t('Current Language')}: {i18n.language}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('Change the language to check if translation works properly.')}
        </Typography>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t('Translation Key Test')}
        </Typography>

        {testKeys.map((key, index) => (
          <Box key={index} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              {t('Key')}: {key}
            </Typography>
            <Typography variant="body1">
              {t('Translation')}: {key.includes('{{name}}') ? t(key, { name: 'Test User' }) : t(key)}
            </Typography>
          </Box>
        ))}
      </Paper>

      <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          onClick={() => i18n.changeLanguage('ko')}
          disabled={i18n.language === 'ko'}
        >
          {t('Korean')}
        </Button>
        <Button
          variant="contained"
          onClick={() => i18n.changeLanguage('en')}
          disabled={i18n.language === 'en'}
        >
          {t('English')}
        </Button>
        <Button
          variant="contained"
          onClick={() => i18n.changeLanguage('ja')}
          disabled={i18n.language === 'ja'}
        >
          {t('Japanese')}
        </Button>
      </Box>
    </Box>
  );
};

export default I18nTest;
