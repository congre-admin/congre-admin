import { Box, Typography, Skeleton, Button, ButtonProps } from '@mui/material';
import { PageContainer } from '@toolpad/core/PageContainer';
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
  title?: string;
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

  const toolpadBreadcrumbs = breadcrumbs?.map(b => ({ title: b.label, path: b.href }));

  return (
    <PageContainer title={title} breadcrumbs={toolpadBreadcrumbs}>
      <Box sx={{ width: '100%', maxWidth: containerWidth, mx: 'auto' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: subtitle || actions ? 3 : 0 }}>
          <Box>
            {subtitle && (
              <Typography variant="body1" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          
          {(actions?.primary || actions?.secondary) && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              {actions.secondary && (
                <Button variant="outlined" size="small" {...actions.secondary}>
                  {actions.secondary.children}
                </Button>
              )}
              {actions?.primary && (
                <Button variant="contained" size="small" {...actions.primary}>
                  {actions.primary.children}
                </Button>
              )}
            </Box>
          )}
        </Box>

        {renderContent()}
      </Box>
    </PageContainer>
  );
}