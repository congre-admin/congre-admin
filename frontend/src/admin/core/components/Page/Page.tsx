import { Box, Typography, Breadcrumbs, Link, Paper, Skeleton, Button, ButtonProps } from '@mui/material';
import { NavigateNext, NavigateBefore } from '@mui/icons-material';
import type { ReactNode } from 'react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageActions {
  primary?: ButtonProps;
  secondary?: ButtonProps & { onClick: () => void };
}

interface PageProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: PageActions;
  loading?: boolean;
  children: ReactNode;
  maxWidth?: false | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
}

const MAX_WIDTH_MAP = {
  xs: 400,
  sm: 600,
  md: 900,
  lg: 1200,
  xl: 1536,
};

export default function Page({
  title,
  subtitle,
  breadcrumbs,
  actions,
  loading = false,
  children,
  maxWidth = 'lg',
}: PageProps) {
  const containerWidth = maxWidth === false ? '100%' : (MAX_WIDTH_MAP[maxWidth as keyof typeof MAX_WIDTH_MAP] || maxWidth);

  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Skeleton variant="rectangular" height={60} />
          <Skeleton variant="rectangular" height={400} />
        </Box>
      );
    }
    return children;
  };

  return (
    <Box sx={{ width: '100%', maxWidth: containerWidth, mx: 'auto' }}>
      {/* Header Section */}
      <Box sx={{ mb: 3 }}>
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumbs
            separator={<NavigateNext fontSize="small" />}
            sx={{ mb: 1.5 }}
          >
            <Link
              underline="hover"
              color="inherit"
              href="/admin"
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              <NavigateBefore sx={{ mr: 0.5, fontSize: 20 }} />
              Inicio
            </Link>
            {breadcrumbs.map((item, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return isLast ? (
                <Typography key={index} color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
                  {item.label}
                </Typography>
              ) : (
                <Link
                  key={index}
                  underline="hover"
                  color="inherit"
                  href={item.href}
                >
                  {item.label}
                </Link>
              );
            })}
          </Breadcrumbs>
        )}

        {/* Title + Actions Row */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h5"
              component="h1"
              sx={{ fontWeight: 600, mb: subtitle ? 0.5 : 0 }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>

          {/* Action Buttons */}
          {(actions?.primary || actions?.secondary) && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              {actions.secondary && (
                <Button
                  variant="outlined"
                  size="small"
                  {...actions.secondary}
                >
                  {actions.secondary.children}
                </Button>
              )}
              {actions?.primary && (
                <Button
                  variant="contained"
                  size="small"
                  {...actions.primary}
                >
                  {actions.primary.children}
                </Button>
              )}
            </Box>
          )}
        </Box>
      </Box>

      {/* Content Section */}
      {renderContent()}
    </Box>
  );
}