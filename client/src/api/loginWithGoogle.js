export const loginWithGoogle = async (idToken) => {
    const response = await fetch("http://localhost:4000/auth/google", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials : "include",
        body: JSON.stringify({ idToken }),
    });
    const data = await response.json();
    return data;
}