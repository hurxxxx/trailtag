import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Box,
  Typography
} from '@mui/material';
import {
  Language as LanguageIcon,
  Check as CheckIcon
} from '@mui/icons-material';

const languages = [
  {
    code: 'ko',
    name: '한국어',
    flag: '🇰🇷'
  },
  {
    code: 'en',
    name: 'English',
    flag: '🇺🇸'
  },
  {
    code: 'ja',
    name: '日本語',
    flag: '🇯🇵'
  }
];

const LanguageSwitcher = ({ variant = 'icon' }) => {
  const { i18n, t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = (languageCode) => {
    i18n.changeLanguage(languageCode);
    handleClose();
  };

  if (variant === 'compact') {
    return (
      <Box>
        <Tooltip title={t('Language')}>
          <IconButton
            onClick={handleClick}
            size="small"
            sx={{
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: 'action.hover',
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="body2" sx={{ fontSize: '1.2rem' }}>
                {currentLanguage.flag}
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 500 }}>
                {currentLanguage.code.toUpperCase()}
              </Typography>
            </Box>
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          PaperProps={{
            sx: {
              mt: 1,
              minWidth: 160,
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              border: '1px solid',
              borderColor: 'divider',
            }
          }}
        >
          {languages.map((language) => (
            <MenuItem
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              selected={language.code === i18n.language}
              sx={{
                py: 1,
                '&.Mui-selected': {
                  backgroundColor: 'primary.50',
                  '&:hover': {
                    backgroundColor: 'primary.100',
                  }
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Typography sx={{ fontSize: '1.2rem' }}>
                  {language.flag}
                </Typography>
              </ListItemIcon>
              <ListItemText
                primary={language.name}
                primaryTypographyProps={{
                  variant: 'body2',
                  fontWeight: language.code === i18n.language ? 600 : 400
                }}
              />
              {language.code === i18n.language && (
                <CheckIcon
                  sx={{
                    ml: 1,
                    fontSize: 16,
                    color: 'primary.main'
                  }}
                />
              )}
            </MenuItem>
          ))}
        </Menu>
      </Box>
    );
  }

  // Default icon variant
  return (
    <Box>
      <Tooltip title={t('Language')}>
        <IconButton
          onClick={handleClick}
          sx={{
            color: 'text.secondary',
            '&:hover': {
              backgroundColor: 'action.hover',
            }
          }}
        >
          <LanguageIcon />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 180,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            border: '1px solid',
            borderColor: 'divider',
          }
        }}
      >
        {languages.map((language) => (
          <MenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            selected={language.code === i18n.language}
            sx={{
              py: 1.5,
              '&.Mui-selected': {
                backgroundColor: 'primary.50',
                '&:hover': {
                  backgroundColor: 'primary.100',
                }
              }
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <Typography sx={{ fontSize: '1.5rem' }}>
                {language.flag}
              </Typography>
            </ListItemIcon>
            <ListItemText
              primary={language.name}
              primaryTypographyProps={{
                variant: 'body1',
                fontWeight: language.code === i18n.language ? 600 : 400
              }}
            />
            {language.code === i18n.language && (
              <CheckIcon
                sx={{
                  ml: 1,
                  fontSize: 18,
                  color: 'primary.main'
                }}
              />
            )}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default LanguageSwitcher;
