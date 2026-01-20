'use client'

import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

const FullPageLoader = () => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default'
      }}
    >
      <CircularProgress />
    </Box>
  )
}

export default FullPageLoader

