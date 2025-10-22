import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Box,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Paper,
  InputAdornment,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Skeleton,
  Alert,
  Fab,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Slider,
  FormControlLabel,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  Add as AddIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  People as PeopleIcon,
  Category as CategoryIcon,
  Tag as TagIcon,
  ExpandMore as ExpandMoreIcon,
  Clear as ClearIcon,
  Sort as SortIcon,
  Event as EventIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchEvents, setFilters, fetchCategories, fetchTags } from '../store/slices/eventSlice';
import { getImageUrl } from '../services/api';
import { useLocale } from '../hooks/useLocale';

const EventsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { formatDate, formatPrice } = useLocale();
  
  const { events, loading, filters, pagination, categories, tags } = useSelector((state) => state.events);

  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [sortBy, setSortBy] = useState('date');

  useEffect(() => {
    dispatch(fetchEvents(filters));
    dispatch(fetchCategories());
    dispatch(fetchTags());
  }, [dispatch, filters]);

  const handleEventClick = (eventId) => {
    navigate(`/events/${eventId}`);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    dispatch(setFilters({ search: e.target.value, page: 1 }));
  };

  const handleCategoryChange = (e) => {
    dispatch(setFilters({ category: e.target.value, page: 1 }));
  };

  const handleStatusChange = (e) => {
    dispatch(setFilters({ status: e.target.value, page: 1 }));
  };

  const handlePriceRangeChange = (event, newValue) => {
    setPriceRange(newValue);
    dispatch(setFilters({ 
      min_price: newValue[0], 
      max_price: newValue[1], 
      page: 1 
    }));
  };

  const handleTagChange = (tagId) => {
    const newTags = selectedTags.includes(tagId)
      ? selectedTags.filter(id => id !== tagId)
      : [...selectedTags, tagId];
    setSelectedTags(newTags);
    dispatch(setFilters({ tags: newTags, page: 1 }));
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    dispatch(setFilters({ sort_by: e.target.value, page: 1 }));
  };

  const handlePageChange = (event, page) => {
    dispatch(setFilters({ page }));
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setPriceRange([0, 1000]);
    setSelectedTags([]);
    setSortBy('date');
    dispatch(setFilters({
      search: '',
      category: '',
      status: '',
      min_price: 0,
      max_price: 1000,
      tags: [],
      sort_by: 'date',
      page: 1
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return 'success';
      case 'draft': return 'default';
      case 'cancelled': return 'error';
      case 'completed': return 'info';
      case 'postponed': return 'warning';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'published': return 'Publié';
      case 'draft': return 'Brouillon';
      case 'cancelled': return 'Annulé';
      case 'completed': return 'Terminé';
      case 'postponed': return 'Reporté';
      default: return status;
    }
  };

  const renderEventCard = (event) => (
    <Card 
      key={event.id}
      sx={{ 
        height: '100%', 
        cursor: 'pointer',
        borderRadius: 2,
        overflow: 'hidden',
        background: (theme) => theme.palette.mode === 'dark' 
          ? 'linear-gradient(135deg, #1E293B 0%, #334155 100%)'
          : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        border: (theme) => theme.palette.mode === 'dark'
          ? '1px solid rgba(255,255,255,0.1)'
          : '1px solid rgba(148,163,184,0.2)',
        display: 'flex',
        flexDirection: 'column',
        '&:hover': { 
          transform: 'translateY(-4px)', 
          boxShadow: (theme) => theme.palette.mode === 'dark'
            ? '0 8px 25px rgba(0,0,0,0.4)'
            : '0 8px 25px rgba(79,70,229,0.15)',
          borderColor: (theme) => theme.palette.mode === 'dark'
            ? 'rgba(255,255,255,0.2)'
            : 'rgba(79,70,229,0.3)',
        },
        transition: 'all 0.3s ease-in-out',
      }}
      onClick={() => handleEventClick(event.id)}
    >
      {event.poster ? (
        <CardMedia
          component="img"
          height="200"
          image={getImageUrl(event.poster)}
          alt={event.title}
          sx={{ objectFit: 'cover', flexShrink: 0 }}
        />
      ) : (
        <Box
          sx={{
            height: 200,
            background: 'linear-gradient(135deg, #4F46E5 0%, #06B6D4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            flexShrink: 0,
          }}
        >
          <EventIcon sx={{ fontSize: 40, opacity: 0.8 }} />
        </Box>
      )}
      
      <CardContent sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
          <Typography variant="h6" sx={{ 
            fontWeight: 600, 
            color: 'text.primary',
            fontSize: { xs: '0.95rem', md: '1rem' },
            lineHeight: 1.3,
            flex: 1,
            mr: 1,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            overflow: 'hidden'
          }}>
            {event.title}
          </Typography>
          <Chip
            label={getStatusLabel(event.status)}
            size="small"
            color={getStatusColor(event.status)}
            sx={{ fontWeight: 500, minWidth: 70, flexShrink: 0, fontSize: '0.75rem' }}
          />
        </Box>

        <Box sx={{ mb: 1.5, height: 40, display: 'flex', alignItems: 'flex-start' }}>
          {event.short_description ? (
            <Typography variant="body2" color="text.secondary" sx={{ 
              lineHeight: 1.4, 
              fontSize: '0.875rem',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical'
            }}>
              {event.short_description}
            </Typography>
          ) : (
            <Box sx={{ height: 40 }} />
          )}
        </Box>

        <Box sx={{ mb: 1.5, height: 80 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.75 }}>
            <CalendarIcon sx={{ fontSize: 14, color: 'text.secondary', mr: 0.75, flexShrink: 0 }} />
            <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
              {formatDate(event.start_date)}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.75 }}>
            <LocationIcon sx={{ fontSize: 14, color: 'text.secondary', mr: 0.75, flexShrink: 0 }} />
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
              {event.location}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.75 }}>
            <MoneyIcon sx={{ fontSize: 14, color: 'success.main', mr: 0.75, flexShrink: 0 }} />
            <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 600, fontSize: '0.8rem' }}>
              {formatPrice(event.price)}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PeopleIcon sx={{ fontSize: 14, color: 'text.secondary', mr: 0.75, flexShrink: 0 }} />
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
              {event.registration_count || 0} inscrits
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mb: 1.5, height: 24 }}>
          {event.category && (
            <Chip
              icon={<CategoryIcon />}
              label={event.category.name}
              size="small"
              variant="outlined"
              sx={{ 
                borderColor: (theme) => theme.palette.mode === 'dark'
                  ? 'rgba(255,255,255,0.3)'
                  : 'rgba(79,70,229,0.3)',
                color: (theme) => theme.palette.mode === 'dark'
                  ? '#FFFFFF'
                  : 'primary.main',
                backgroundColor: (theme) => theme.palette.mode === 'dark'
                  ? 'rgba(255,255,255,0.1)'
                  : 'transparent',
                fontWeight: 500,
                fontSize: '0.75rem',
                height: 24
              }}
            />
          )}
        </Box>

        <Box sx={{ mb: 1.5, height: 24 }}>
          {event.tags && event.tags.length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {event.tags.slice(0, 3).map((tag) => (
                <Chip
                  key={tag.id}
                  icon={<TagIcon />}
                  label={tag.name}
                  size="small"
                  sx={{ 
                    backgroundColor: (theme) => theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.15)'
                      : 'rgba(79,70,229,0.08)',
                    color: (theme) => theme.palette.mode === 'dark'
                      ? '#FFFFFF'
                      : 'primary.main',
                    fontWeight: 500,
                    fontSize: '0.75rem',
                    height: 24,
                    '&:hover': {
                      backgroundColor: (theme) => theme.palette.mode === 'dark'
                        ? 'rgba(255,255,255,0.2)'
                        : 'rgba(79,70,229,0.15)',
                    }
                  }}
                />
              ))}
              {event.tags.length > 3 && (
                <Chip
                  label={`+${event.tags.length - 3}`}
                  size="small"
                  variant="outlined"
                  sx={{ 
                    borderColor: (theme) => theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.3)'
                      : 'rgba(79,70,229,0.3)',
                    color: (theme) => theme.palette.mode === 'dark'
                      ? '#FFFFFF'
                      : 'primary.main',
                    fontSize: '0.75rem',
                    height: 24
                  }}
                />
              )}
            </Box>
          )}
        </Box>

        <Button
          variant="contained"
          fullWidth
          sx={{
            background: 'linear-gradient(135deg, #4F46E5 0%, #06B6D4 100%)',
            fontWeight: 600,
            mt: 'auto',
            py: 1,
            fontSize: '0.875rem',
            height: 36,
            '&:hover': {
              background: 'linear-gradient(135deg, #4338CA 0%, #0891B2 100%)',
              transform: 'translateY(-1px)',
            },
            transition: 'all 0.2s ease-in-out',
          }}
        >
          Voir l'événement
        </Button>
      </CardContent>
    </Card>
  );

  const renderEventList = (event) => (
    <Card 
      key={event.id}
      sx={{ 
        mb: 4,
        cursor: 'pointer',
        borderRadius: 2,
        overflow: 'hidden',
        background: (theme) => theme.palette.mode === 'dark' 
          ? 'linear-gradient(135deg, #1E293B 0%, #334155 100%)'
          : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        border: (theme) => theme.palette.mode === 'dark'
          ? '1px solid rgba(255,255,255,0.1)'
          : '1px solid rgba(148,163,184,0.2)',
        '&:hover': { 
          transform: 'translateY(-2px)', 
          boxShadow: (theme) => theme.palette.mode === 'dark'
            ? '0 6px 20px rgba(0,0,0,0.3)'
            : '0 6px 20px rgba(79,70,229,0.12)',
          borderColor: (theme) => theme.palette.mode === 'dark'
            ? 'rgba(255,255,255,0.3)'
            : 'rgba(79,70,229,0.3)',
        },
        transition: 'all 0.3s ease-in-out',
      }}
      onClick={() => handleEventClick(event.id)}
    >
      <Grid container>
        <Grid item xs={12} sm={3}>
          {event.poster ? (
            <CardMedia
              component="img"
              height="180"
              image={getImageUrl(event.poster)}
              alt={event.title}
              sx={{ objectFit: 'cover', height: '100%' }}
            />
          ) : (
            <Box
              sx={{
                height: 180,
                background: 'linear-gradient(135deg, #4F46E5 0%, #06B6D4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
              }}
            >
              <EventIcon sx={{ fontSize: 40, opacity: 0.8 }} />
            </Box>
          )}
        </Grid>
        
        <Grid item xs={12} sm={9}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Typography variant="h6" sx={{ 
                fontWeight: 600, 
                color: 'text.primary',
                fontSize: { xs: '1rem', md: '1.125rem' },
                lineHeight: 1.3,
                flex: 1,
                mr: 2
              }}>
                {event.title}
              </Typography>
              <Chip
                label={getStatusLabel(event.status)}
                size="small"
                color={getStatusColor(event.status)}
                sx={{ fontWeight: 500, minWidth: 70, fontSize: '0.75rem' }}
              />
            </Box>

            {event.short_description && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.4, fontSize: '0.875rem' }}>
                {event.short_description}
              </Typography>
            )}

            <Grid container spacing={3} sx={{ mb: 2 }}>
              <Grid item xs={6} sm={3}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CalendarIcon sx={{ fontSize: 14, color: 'text.secondary', mr: 0.75 }} />
                  <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
                    {formatDate(event.start_date)}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <LocationIcon sx={{ fontSize: 14, color: 'text.secondary', mr: 0.75 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    {event.location}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <MoneyIcon sx={{ fontSize: 14, color: 'success.main', mr: 0.75 }} />
                  <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 600, fontSize: '0.8rem' }}>
                    {formatPrice(event.price)}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PeopleIcon sx={{ fontSize: 14, color: 'text.secondary', mr: 0.75 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    {event.registration_count || 0} inscrits
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {event.category && (
                  <Chip
                    icon={<CategoryIcon />}
                    label={event.category.name}
                    size="small"
                    variant="outlined"
                    sx={{ 
                      borderColor: (theme) => theme.palette.mode === 'dark'
                        ? 'rgba(255,255,255,0.3)'
                        : 'rgba(79,70,229,0.3)',
                      color: (theme) => theme.palette.mode === 'dark'
                        ? '#FFFFFF'
                        : 'primary.main',
                      backgroundColor: (theme) => theme.palette.mode === 'dark'
                        ? 'rgba(255,255,255,0.1)'
                        : 'transparent',
                      fontWeight: 500,
                      fontSize: '0.75rem',
                      height: 24
                    }}
                  />
                )}
                
                {event.tags && event.tags.slice(0, 2).map((tag) => (
                  <Chip
                    key={tag.id}
                    icon={<TagIcon />}
                    label={tag.name}
                    size="small"
                    sx={{ 
                      backgroundColor: (theme) => theme.palette.mode === 'dark'
                        ? 'rgba(255,255,255,0.15)'
                        : 'rgba(79,70,229,0.08)',
                      color: (theme) => theme.palette.mode === 'dark'
                        ? '#FFFFFF'
                        : 'primary.main',
                      fontWeight: 500,
                      fontSize: '0.75rem',
                      height: 24
                    }}
                  />
                ))}
              </Box>

              <Button
                variant="contained"
                size="small"
                sx={{
                  background: (theme) => theme.palette.mode === 'dark'
                    ? 'linear-gradient(135deg, #818CF8 0%, #22D3EE 100%)'
                    : 'linear-gradient(135deg, #4F46E5 0%, #06B6D4 100%)',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  height: 36,
                  px: 2,
                  '&:hover': {
                    background: (theme) => theme.palette.mode === 'dark'
                      ? 'linear-gradient(135deg, #6366F1 0%, #0891B2 100%)'
                      : 'linear-gradient(135deg, #4338CA 0%, #0891B2 100%)',
                    boxShadow: (theme) => theme.palette.mode === 'dark'
                      ? '0 6px 20px rgba(0,0,0,0.3)'
                      : '0 6px 20px rgba(79,70,229,0.12)',
                    borderColor: (theme) => theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.3)'
                      : 'rgba(79,70,229,0.3)',
                  },
                  transition: 'all 0.3s ease-in-out',
                }}
              >
                Voir détails
              </Button>
            </Box>
          </CardContent>
        </Grid>
      </Grid>
    </Card>
  );

  const renderSkeletons = () => (
    <Grid 
      container 
      spacing={6}
      sx={{ 
        alignItems: 'stretch',
        '& .MuiGrid-item': {
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      {[...Array(6)].map((_, index) => (
        <Grid item xs={12} sm={6} md={4} key={index} sx={{ height: 500 }}>
          <Card sx={{ 
            height: '100%', 
            borderRadius: 2,
            background: (theme) => theme.palette.mode === 'dark' 
              ? 'linear-gradient(135deg, #1E293B 0%, #334155 100%)'
              : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: (theme) => theme.palette.mode === 'dark'
              ? '1px solid rgba(255,255,255,0.1)'
              : '1px solid rgba(148,163,184,0.2)',
          }}>
            <Skeleton variant="rectangular" height={200} />
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Skeleton variant="text" height={48} sx={{ flex: 1, mr: 1 }} />
                <Skeleton variant="rectangular" width={70} height={24} />
              </Box>
              <Box sx={{ mb: 1.5, height: 40 }}>
                <Skeleton variant="text" height={20} sx={{ mb: 0.5 }} />
                <Skeleton variant="text" height={20} />
              </Box>
              <Box sx={{ mb: 1.5, height: 80 }}>
                <Skeleton variant="text" height={20} sx={{ mb: 0.75 }} />
                <Skeleton variant="text" height={20} sx={{ mb: 0.75 }} />
                <Skeleton variant="text" height={20} sx={{ mb: 0.75 }} />
                <Skeleton variant="text" height={20} />
              </Box>
              <Box sx={{ mb: 1.5, height: 24 }}>
                <Skeleton variant="rectangular" height={24} width={120} />
              </Box>
              <Box sx={{ mb: 1.5, height: 24 }}>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Skeleton variant="rectangular" height={24} width={60} />
                  <Skeleton variant="rectangular" height={24} width={60} />
                  <Skeleton variant="rectangular" height={24} width={60} />
                </Box>
              </Box>
              <Skeleton variant="rectangular" height={36} />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* En-tête de la page */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" sx={{ 
          fontWeight: 700,
          color: 'text.primary',
          mb: 2,
          fontSize: { xs: '2rem', md: '2.5rem' }
        }}>
          Découvrez les événements
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
          Trouvez l'événement parfait pour vous
        </Typography>
      </Box>

      {/* Barre de filtres et recherche */}
      <Paper elevation={1} sx={{ 
        p: { xs: 2, md: 3 },
        mb: 4,
        background: (theme) => theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, #1E293B 0%, #334155 100%)'
          : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        border: (theme) => theme.palette.mode === 'dark'
          ? '1px solid rgba(255,255,255,0.1)'
          : '1px solid rgba(148,163,184,0.2)',
        borderRadius: 2,
      }}>
        <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
              placeholder="Rechercher un événement..."
                value={searchTerm}
                onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="primary" />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchTerm('')}>
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: 'white',
                }
              }}
              />
            </Grid>
          
          <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Catégorie</InputLabel>
                <Select
                value={filters.category || ''}
                  label="Catégorie"
                  onChange={handleCategoryChange}
                sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="">Toutes</MenuItem>
                  {Array.isArray(categories) && categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          
          <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Statut</InputLabel>
                <Select
                value={filters.status || ''}
                  label="Statut"
                  onChange={handleStatusChange}
                sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="">Tous</MenuItem>
                  <MenuItem value="published">Publié</MenuItem>
                  <MenuItem value="draft">Brouillon</MenuItem>
                  <MenuItem value="cancelled">Annulé</MenuItem>
                <MenuItem value="completed">Terminé</MenuItem>
                <MenuItem value="postponed">Reporté</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Trier par</InputLabel>
              <Select
                value={sortBy}
                label="Trier par"
                onChange={handleSortChange}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="date">Date</MenuItem>
                <MenuItem value="price">Prix</MenuItem>
                <MenuItem value="title">Titre</MenuItem>
                <MenuItem value="popularity">Popularité</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => setFilterDrawerOpen(true)}
                sx={{
                  borderColor: (theme) => theme.palette.mode === 'dark'
                    ? 'rgba(255,255,255,0.3)'
                    : 'rgba(79,70,229,0.3)',
                  color: (theme) => theme.palette.mode === 'dark'
                    ? '#FFFFFF'
                    : 'primary.main',
                  '&:hover': {
                    borderColor: (theme) => theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.5)'
                      : 'rgba(79,70,229,0.5)',
                    backgroundColor: (theme) => theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.08)'
                      : 'rgba(79,70,229,0.08)',
                  },
                }}
              >
                Filtres
              </Button>
              
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(e, newMode) => newMode && setViewMode(newMode)}
                size="small"
                sx={{
                  '& .MuiToggleButton-root': {
                    borderColor: (theme) => theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.3)'
                      : 'rgba(79,70,229,0.3)',
                    color: (theme) => theme.palette.mode === 'dark'
                      ? '#FFFFFF'
                      : 'primary.main',
                    '&.Mui-selected': {
                      backgroundColor: (theme) => theme.palette.mode === 'dark'
                        ? 'rgba(255,255,255,0.2)'
                        : 'rgba(79,70,229,0.15)',
                      color: (theme) => theme.palette.mode === 'dark'
                        ? '#FFFFFF'
                        : 'primary.main',
                      borderColor: (theme) => theme.palette.mode === 'dark'
                        ? 'rgba(255,255,255,0.5)'
                        : 'rgba(79,70,229,0.5)',
                    },
                    '&:hover': {
                      backgroundColor: (theme) => theme.palette.mode === 'dark'
                        ? 'rgba(255,255,255,0.1)'
                        : 'rgba(79,70,229,0.08)',
                    },
                  },
                }}
              >
                <ToggleButton value="grid" aria-label="Vue grille">
                  <ViewModuleIcon />
                </ToggleButton>
                <ToggleButton value="list" aria-label="Vue liste">
                  <ViewListIcon />
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
            </Grid>
          </Grid>

        {/* Bouton de réinitialisation des filtres */}
        {(searchTerm || filters.category || filters.status || filters.min_price > 0 || filters.max_price < 1000 || selectedTags.length > 0) && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Button
              variant="outlined"
              onClick={clearAllFilters}
              startIcon={<ClearIcon />}
              sx={{ borderRadius: 2 }}
            >
              Réinitialiser tous les filtres
            </Button>
        </Box>
        )}
      </Paper>

      {/* Bouton flottant pour créer un événement */}
      <Fab
        color="primary"
        aria-label="Créer un événement"
        onClick={() => navigate('/create-event')}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: 'linear-gradient(135deg, #4F46E5 0%, #06B6D4 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #4338CA 0%, #0891B2 100%)',
            transform: 'scale(1.05)',
          },
          transition: 'all 0.3s ease-in-out',
        }}
      >
        <AddIcon />
      </Fab>

      {/* Contenu principal */}
      {loading ? (
        renderSkeletons()
      ) : events && events.length > 0 ? (
        <>
          {/* Informations sur les résultats */}
          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              {pagination.totalCount || events.length} événement(s) trouvé(s)
            </Typography>
      </Box>

      {/* Liste des événements */}
          {viewMode === 'grid' ? (
            <Grid 
              container 
              spacing={6} 
              sx={{ 
                alignItems: 'stretch',
                '& .MuiGrid-item': {
                  display: 'flex',
                  flexDirection: 'column'
                }
              }}
            >
              {events.map((event) => (
                <Grid item xs={12} sm={6} md={4} key={event.id} sx={{ height: 500 }}>
                  {renderEventCard(event)}
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box>
              {events.map(renderEventList)}
            </Box>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={pagination.totalPages}
                page={pagination.currentPage}
                onChange={handlePageChange}
                color="primary"
                size="large"
                showFirstButton
                showLastButton
                sx={{
                  '& .MuiPaginationItem-root': {
                    borderRadius: 1.5,
                    fontWeight: 500,
                    fontSize: '0.875rem',
                  }
                }}
              />
            </Box>
          )}
        </>
      ) : (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <EventIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2, opacity: 0.6 }} />
          <Typography variant="h5" color="text.secondary" sx={{ mb: 2, fontWeight: 500 }}>
            Aucun événement trouvé
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, fontSize: '0.95rem' }}>
            Essayez de modifier vos critères de recherche ou créez votre premier événement !
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            onClick={() => navigate('/create-event')}
            sx={{
              background: 'linear-gradient(135deg, #4F46E5 0%, #06B6D4 100%)',
              fontWeight: 600,
              '&:hover': {
                background: 'linear-gradient(135deg, #4338CA 0%, #0891B2 100%)',
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.3s ease-in-out',
            }}
          >
            Créer un événement
          </Button>
        </Box>
      )}

      {/* Drawer des filtres avancés */}
      <Drawer
        anchor="right"
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 380 },
            p: 3,
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          }
        }}
      >
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
            Filtres avancés
          </Typography>
          <Button
            variant="outlined"
            onClick={clearAllFilters}
            startIcon={<ClearIcon />}
            fullWidth
            sx={{ borderRadius: 2 }}
          >
            Réinitialiser
          </Button>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Filtre par prix */}
        <Accordion defaultExpanded sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
              Fourchette de prix
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ px: 1 }}>
              <Slider
                value={priceRange}
                onChange={handlePriceRangeChange}
                valueLabelDisplay="auto"
                min={0}
                max={1000}
                step={10}
                marks={[
                  { value: 0, label: '0$' },
                  { value: 500, label: '500$' },
                  { value: 1000, label: '1000$' }
                ]}
                sx={{
                  '& .MuiSlider-mark': {
                    backgroundColor: 'rgba(79,70,229,0.3)',
                  },
                  '& .MuiSlider-markLabel': {
                    fontSize: '0.75rem',
                    color: 'text.secondary',
                  }
                }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                  {priceRange[0]}$
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                  {priceRange[1]}$
                </Typography>
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Filtre par tags */}
        {tags && tags.length > 0 && (
          <Accordion sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
                Tags
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {tags.map((tag) => (
                  <FormControlLabel
                    key={tag.id}
                    control={
                      <Checkbox
                        checked={selectedTags.includes(tag.id)}
                        onChange={() => handleTagChange(tag.id)}
                        sx={{
                          color: 'primary.main',
                          '&.Mui-checked': {
                            color: 'primary.main',
                          },
                        }}
                      />
                    }
                    label={tag.name}
                    sx={{ 
                      '& .MuiFormControlLabel-label': { 
                        fontSize: '0.875rem',
                        color: 'text.primary'
                      } 
                    }}
                  />
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>
        )}

        <Box sx={{ mt: 'auto', pt: 2 }}>
          <Button
            variant="contained"
            fullWidth
            onClick={() => setFilterDrawerOpen(false)}
            sx={{
              background: 'linear-gradient(135deg, #4F46E5 0%, #06B6D4 100%)',
              fontWeight: 600,
              borderRadius: 2,
              '&:hover': {
                background: 'linear-gradient(135deg, #4338CA 0%, #0891B2 100%)',
              }
            }}
          >
            Appliquer les filtres
          </Button>
        </Box>
      </Drawer>
    </Container>
  );
};

export default EventsPage; 