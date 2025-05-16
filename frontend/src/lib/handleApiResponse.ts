// src/lib/handleApiResponse.ts
export async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok && response.status !== 204) { // 204 is success with no content (e.g., for DELETE)
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      // If response is not JSON or parsing fails
      errorData = { message: `HTTP error! status: ${response.status}. Response not in JSON format.` };
    }
    throw new Error(
      errorData.message || `HTTP error! status: ${response.status}`
    );
  }
  if (response.status === 204) {
    return null as T; // Or an appropriate empty success object if preferred
  }
  return response.json();
}