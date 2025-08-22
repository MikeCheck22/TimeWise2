// Configure API request to include auth headers
export function configureApiWithAuth(token: string | null) {
  // This is a placeholder - the actual implementation will be in the queryClient
  return {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };
}