export default function AccountCM() {
    return (
        <>
      <Toaster />
      <div className="flex flex-col items-center bg-white shadow-lg rounded-lg p-20 my-20 max-w-7xl mx-auto">
        {/* Profile Header */}
        {isOwnAccount ? (
          <h4 className="text-xl font-bold m-2 p-2">Your Profile</h4>
        ) : (
          <h4 className="text-3xl p-2">Account</h4>
        )}
        <hr className="my-6 border-t-2 border-black w-full" />

        {/* Profile Image */}
        <div className="relative w-40 h-40">
          <CldImage
            src={profileData?.profileImage || ""}
            alt="Profile Image"
            width={160}
            height={160}
            className="rounded-full shadow-md w-full h-full object-cover"
          />

          {isOwnAccount && (
            <CldUploadWidget
              uploadPreset="hg1ghiyh"
              onSuccess={({ info }: any) => handleImageChange(info)}
            >
              {({ open }) => (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    open();
                  }}
                  className="absolute bottom-2 right-2 bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1 rounded-full shadow-md"
                >
                  Change Image
                </button>
              )}
            </CldUploadWidget>
          )}
        </div>

        {/* Profile Details */}
        <div className="text-center mt-6">
          <h1 className="text-4xl font-semibold text-gray-800 mb-2">
            {profileData?.name || "Guest"}
          </h1>
          <h2 className="text-4xl p-2 text-gray-600">
            {profileData?.email || "Not provided"}
          </h2>
        </div>

        {/* Followers Section */}
        <div className="mt-4 flex flex-col items-center">
          <p className="text-xl text-gray-600">
            Followers:{" "}
            <span className="font-bold text-gray-800">
              {profileData?.follow}
            </span>
          </p>
          <ul>
            <h4 className="p-2">Followers:</h4>
            {followers.map((account, idx) => (
              <li key={idx}>
                <p>
                  {idx + 1} - Name Email: {account.split("@")[0]}
                </p>
              </li>
            ))}
          </ul>
          {isOwnAccount ? (
            <p className="text-lg font-bold p-2">You cannot follow yourself</p>
          ) : (
            <button
              className="mt-4 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-md shadow-lg transition-all duration-200 disabled:opacity-50"
              onClick={handleFollow}
              disabled={loading}
            >
              {loading ? "Processing..." : isFollowing ? "Unfollow" : "Follow"}
            </button>
          )}
        </div>

        <hr className="my-6 border-t-2 border-black w-full" />
        </>
    )
}