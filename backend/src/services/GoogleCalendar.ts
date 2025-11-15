// stub for calendar provider interaction
export async function createGoogleEvent(eventData: any) {
  // TODO: implement OAuth and Google Calendar REST API integration
  // Return a mock provider id
  return { providerId: "gcal_mock_123", ...eventData };
}
